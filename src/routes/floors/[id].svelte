<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ params, fetch }) => {
    if (params.id === 'new') {
      return { props: { floor: emptyFloor } };
    }
    const response = await fetch(`/api/floors/${params.id}`);
    const floor: FloorLevel = await response.json();

    if (!floor) {
      return goto('/');
    }

    return { props: { floor } };
  };
</script>

<script lang="ts">
  /* eslint-disable @typescript-eslint/no-explicit-any */
  import Map from '$lib/maps/Map.svelte';
  import type mapbox from 'mapbox-gl';
  import { setGeoRefData, getPositionInfo } from '$lib/helpers/georeference';
  import { convertFileToImage, convertImageToGeoTiff, sourceCoordinatesToGcpArr } from '$lib/helpers/gdal';
  import type { FloorLevel } from '$lib/types';
  import { emptyFloor } from './_empty-floor';
  import { goto } from '$app/navigation';

  export let floor: FloorLevel;

  let mapComponent: Map;
  let map: mapbox.Map;
  let sourceCoordinates: number[][];
  let imageInput: HTMLInputElement;
  let uploadedImage: File;
  let loadingMessage = '';
  let error: string;
  let initLat = 4;
  let initLng = 6;

  async function mapReady(mapInstance: mapbox.Map) {
    map = mapInstance;

    if (floor.id !== 'new') {
      // Clear map
      mapComponent.removeSource('sourceId');
      mapComponent.removeLayer('layerId');
      mapComponent.removeMarkers();
      // add existing
      map.addSource('sourceId', { type: 'image', url: floor.previewImage, coordinates: getPositionInfo(floor.georeference) });
      map.addLayer({ id: 'layerId', type: 'raster', source: 'sourceId', paint: { 'raster-fade-duration': 0 } });
      mapComponent.setMarkerAndListeners('sourceId', floor.georeference);

      // dataURLtoFile
      uploadedImage = await fetch(floor.previewImage)
        .then(res => res.arrayBuffer())
        .then(buf => new File([buf], floor.filename, { type: floor.type }));
    }
  }

  function setPreviewImage(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    uploadedImage = event.currentTarget.files[0];

    const setupLayer = (image: HTMLImageElement) => {
      // Clear map
      if (map.getLayer('layerId')) {
        map.removeLayer('layerId');
      }
      if (map.getSource('sourceId')) {
        map.removeSource('sourceId');
      }
      mapComponent.removeMarkers();

      // update previewImage
      const { type, name } = uploadedImage;
      floor = { ...floor, previewImage: image.src, filename: name, name, type };

      if (floor.id === 'new') {
        // todo extract from bbox of venue
        const sw: mapbox.LngLatLike = [0, 0];
        const ne: mapbox.LngLatLike = [initLng, initLat];
        const initialGeoreference = setGeoRefData(image.naturalWidth, image.naturalHeight, sw, ne);
        floor = { ...floor, georeference: initialGeoreference };
      }

      map.addSource('sourceId', { type: 'image', url: floor.previewImage, coordinates: getPositionInfo(floor.georeference) });
      map.addLayer({ id: 'layerId', type: 'raster', source: 'sourceId', paint: { 'raster-fade-duration': 0 } });

      mapComponent.setMarkerAndListeners('sourceId', floor.georeference);
    };

    convertFileToImage(uploadedImage, setupLayer);
  }

  async function onConvertToGeotiffSelected() {
    loadingMessage = 'Converting to GeoTIFF...';

    const geotiffFile = await convertImageToGeoTiff(uploadedImage, sourceCoordinatesToGcpArr(sourceCoordinates, floor.georeference.bbox));
    await uploadGeotiff(geotiffFile);
  }

  /**
   * Upload image to presigned S3 url, create image from tileset, poll status and add image layer when tileset is created.
   */
  async function uploadGeotiff(geotiffFile: File) {
    error = null;
    loadingMessage = 'getting signed url...';

    // S3 url
    const mapsResponse = await fetch('/api/tilesets/s3');

    if (!mapsResponse.ok) {
      error = 'Failed to get signed url';
      loadingMessage = null;

      return;
    }

    // store geotiff on S3
    const { signedUrl, fileUrl } = await mapsResponse.json();

    loadingMessage = 'uploading to S3...';
    await fetch(signedUrl, { body: geotiffFile, method: 'PUT' });

    loadingMessage = 'converting geotiff to tileset...';
    console.log('floor.tileset', floor.tileset);

    const convertResponse = await fetch(`/api/tilesets/${floor.tileset}`, {
      body: JSON.stringify({ fileUrl, name: geotiffFile.name }),
      method: 'POST',
    });
    const { message, id: uploadId } = await convertResponse.json();

    if (!convertResponse.ok) {
      error = message;
      loadingMessage = null;

      return;
    }

    const uploadResult = await getUploadResultWhenDone(uploadId);

    if (uploadResult.error) {
      error = uploadResult.error;
      loadingMessage = null;

      return;
    }

    loadingMessage = 'done converting';

    map.addSource(uploadResult.tileset, { type: 'raster', url: `mapbox://${uploadResult.tileset}` });
    map.addLayer({ id: uploadResult.tileset, type: 'raster', source: uploadResult.tileset });

    await storeTileset(uploadResult.tileset);
    goto('/');
  }

  async function storeTileset(tileset: string) {
    floor = {
      ...floor,
      tileset,
      georeference: setGeoRefData(floor.georeference.bbox[2], floor.georeference.bbox[3], sourceCoordinates[3], sourceCoordinates[1]),
    };

    if (floor.id === 'new') {
      await fetch('/api/floors', { body: JSON.stringify(floor), method: 'POST' });

      return;
    }

    await fetch(`/api/floors/${floor.id}`, { body: JSON.stringify(floor), method: 'PUT' });
  }

  async function getUploadResultWhenDone(id: string) {
    const response = await fetch(`/api/tilesets/jobs/${id}`);
    const result = await response.json();

    if (result.complete || result.error) {
      return result;
    }

    // wait for 2 seconds before querying status
    await new Promise(resolve => setTimeout(resolve, 2000));

    return await getUploadResultWhenDone(id);
  }
</script>

<div class="flex flex-col h-full">
  <div class="px-4 py-2">
    <a class="text-blue-600" href="/">home</a>
  </div>

  <div class="p-4 py-2">
    <h2>Georeference image (jpg/png)</h2>
  </div>

  <div class="p-4 py-2">
    {#if floor}
      floor: {floor.number} | {floor?.filename} | {floor.tileset}
    {/if}

    {#if loadingMessage}
      <p class="text-gray-500">{loadingMessage}</p>
    {/if}
    {#if error}
      <p class="text-red-500">error processing image: {error}</p>
    {/if}
  </div>

  <small class="text-gray-500">
    {JSON.stringify(sourceCoordinates)}
  </small>
  <small>{floor.georeference.bbox}</small>
  <div class="flex justify-between p-4 py-2">
    <div>
      <button on:click={() => imageInput.click()} type="button" class="btn btn-primary">select Image</button>
      <input class="hidden" type="file" accept=".jpg, .jpeg, .png" on:change={e => setPreviewImage(e)} bind:this={imageInput} />
    </div>

    <button disabled={!uploadedImage && !floor.previewImage} on:click={() => onConvertToGeotiffSelected()} type="button" class="btn btn-primary"
      >save</button
    >
  </div>

  <div class="flex-1">
    <Map bind:this={mapComponent} bind:sourceCoordinates on:mapReady={e => mapReady(e.detail)} />
  </div>
</div>
