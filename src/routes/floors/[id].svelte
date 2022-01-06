<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = ({ params }) => {
    if (!browser) {
      return {};
    }

    const localFloors = window.localStorage.getItem('floors');
    const storedFloors: FloorLevel[] = localFloors ? JSON.parse(localFloors) : [];

    if (params.id === 'new') {
      return { props: { floor: emptyFloor, storedFloors } };
    }

    const floor = storedFloors.find(floor => floor.id === params.id);

    if (!floor) {
      return goto('/');
    }

    return { props: { floor, storedFloors } };
  };
</script>

<script lang="ts">
  /* eslint-disable @typescript-eslint/no-explicit-any */
  import Map from '$lib/maps/Map.svelte';
  import type mapbox from 'mapbox-gl';
  import { setGeoRefData, getPositionInfo } from '$lib/helpers/georeference';
  import { convertFileToImage, convertImageToGeoTiff } from '$lib/helpers/gdal';
  import { nanoid } from 'nanoid';
  import type { FloorLevel } from '$lib/types';
  import { emptyFloor } from './_empty-floor';
  import { goto } from '$app/navigation';
  import { browser } from '$app/env';

  export let storedFloors: FloorLevel[];
  export let floor: FloorLevel;

  let mapComponent: Map;
  let map: mapbox.Map;
  let gcps: string[];
  let imageInput: HTMLInputElement;
  let uploadedImage: File;
  let loadingMessage = '';
  let error: string;
  let initLat = 4;
  let initLng = 6;

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
      floor = { ...floor, previewImage: image.src, filename: uploadedImage.name };

      if (floor.id === 'new') {
        // todo extract from bbox of venue
        const sw: mapbox.LngLatLike = [0, 0];
        const ne: mapbox.LngLatLike = [initLng, initLat];
        const initialGeoreference = setGeoRefData(image.naturalWidth, image.naturalHeight, sw, ne);
        floor = { ...floor, georeference: initialGeoreference };
      }

      map.addSource('sourceId', { type: 'image', url: image.src, coordinates: getPositionInfo(floor.georeference) });
      map.addLayer({ id: 'layerId', type: 'raster', source: 'sourceId', paint: { 'raster-fade-duration': 0 } });

      mapComponent.dragImage('sourceId', floor.georeference);

      console.log(floor);
    };

    convertFileToImage(uploadedImage, setupLayer);
  }

  async function onConvertToGeotiffSelected() {
    loadingMessage = 'Converting to GeoTIFF...';
    const geotiffFile = await convertImageToGeoTiff(uploadedImage, gcps);
    await uploadGeotiff(geotiffFile);
  }

  /**
   * Upload image to presigned S3 url, create image from tileset, poll status and add image layer when tileset is created.
   */
  async function uploadGeotiff(geotiffFile: File) {
    error = null;
    loadingMessage = 'getting signed url...';

    const mapsResponse = await fetch('/api/tilesets/s3');
    if (!mapsResponse.ok) {
      error = 'Failed to get signed url';
      loadingMessage = null;

      return;
    }

    const { signedUrl, fileUrl } = await mapsResponse.json();
    loadingMessage = 'uploading to S3...';
    await fetch(signedUrl, { body: geotiffFile, method: 'PUT' });

    loadingMessage = 'converting geotiff to tileset...';
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

    storeTileset(uploadResult.tileset);
    goto('/');
  }

  export function storeTileset(tileset: string) {
    if (floor.id === 'new') {
      window.localStorage.setItem('floors', JSON.stringify([...storedFloors, { ...floor, id: nanoid(8), tileset }]));

      return;
    }

    const floorToUpdate = storedFloors.find(f => f.id === floor.id);
    if (!floorToUpdate) {
      throw new Error('Could not find floor to update');
    }

    const newFloors = [...storedFloors.filter(f => f.id !== floor.id), { ...floorToUpdate, tileset, floor }];
    window.localStorage.setItem('floors', JSON.stringify(newFloors));
  }

  export async function getUploadResultWhenDone(id: string) {
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
      floor: {floor.number}
    {/if}

    {#if loadingMessage}
      <p>{loadingMessage}</p>
    {/if}
    {#if error}
      <p>error processing image: {error}</p>
    {/if}
  </div>

  <div class="flex justify-between p-4 py-2">
    <div>
      <button on:click={() => imageInput.click()} type="button" class="btn btn-primary">select Image</button>
      <input class="hidden" type="file" accept=".jpg, .jpeg, .png" on:change={e => setPreviewImage(e)} bind:this={imageInput} />
      {floor?.filename}
    </div>

    <button disabled={!uploadedImage} on:click={() => onConvertToGeotiffSelected()} type="button" class="btn btn-primary">save</button>
  </div>

  <div class="flex-1">
    <Map bind:this={mapComponent} bind:gcps on:mapReady={event => (map = event.detail)} />
  </div>
</div>
