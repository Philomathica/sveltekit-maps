<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ params, fetch }) => {
    const response = await fetch(`/api/venues/${params.venueId}`);
    const venue: Venue = await response.json();

    if (params.floorId === 'new') {
      return { props: { venue, floor: emptyFloor } };
    }

    const floor = venue.floors.find(f => f.id === params.floorId);

    if (!venue || !floor) {
      return { status: 404 };
    }

    return { props: { venue, floor } };
  };
</script>

<script lang="ts">
  import Map from '$lib/maps/Map.svelte';
  import type { LngLatLike, Map as MapboxMap } from 'mapbox-gl';
  import type { FloorLevel, MapboxJobStatus, Venue } from '$lib/types';
  import { setGeoRefData, getPositionInfo } from '$lib/helpers/georeference';
  import { convertFileToImage, convertImageToGeoTiff, sourceCoordinatesToGcpArr } from '$lib/helpers/gdal';
  import { emptyFloor } from './_empty-floor';
  import { goto } from '$app/navigation';
  import { nanoid } from 'nanoid';

  export let venue: Venue;
  export let floor: FloorLevel;

  let mapComponent: Map;
  let map: MapboxMap;
  let sourceCoordinates: number[][];
  let imageInput: HTMLInputElement;
  let uploadedImage: File;
  let loadingMessage = '';
  let error: string;
  let initLat = 4;
  let initLng = 6;

  async function mapReady(mapInstance: MapboxMap) {
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

  async function setPreviewImage(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    uploadedImage = file;

    const image = await convertFileToImage(uploadedImage);

    // Clear map
    if (map.getLayer('layerId')) {
      map.removeLayer('layerId');
    }
    if (map.getSource('sourceId')) {
      map.removeSource('sourceId');
    }
    mapComponent.removeMarkers();

    // update previewImage
    const { type, name: filename } = uploadedImage;
    floor = { ...floor, previewImage: image.src, filename, type };

    if (floor.id === 'new') {
      // todo extract from bbox of venue
      const sw: LngLatLike = [0, 0];
      const ne: LngLatLike = [initLng, initLat];
      const initialGeoreference = setGeoRefData(image.naturalWidth, image.naturalHeight, sw, ne);
      floor = { ...floor, georeference: initialGeoreference };
    }

    map.addSource('sourceId', { type: 'image', url: floor.previewImage, coordinates: getPositionInfo(floor.georeference) });
    map.addLayer({ id: 'layerId', type: 'raster', source: 'sourceId', paint: { 'raster-fade-duration': 0 } });

    mapComponent.setMarkerAndListeners('sourceId', floor.georeference);
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
    error = '';
    loadingMessage = 'getting signed url...';

    // S3 url
    const mapsResponse = await fetch('/api/tilesets/s3');

    if (!mapsResponse.ok) {
      error = 'Failed to get signed url';
      loadingMessage = '';

      return;
    }

    // store geotiff on S3
    const { signedUrl, fileUrl } = await mapsResponse.json();
    loadingMessage = 'uploading to S3...';
    await fetch(signedUrl, { body: geotiffFile, method: 'PUT' });

    loadingMessage = 'converting geotiff to tileset...';
    const convertResponse = await fetch(`/api/tilesets/${floor.tileset}`, {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ fileUrl, name: geotiffFile.name }),
    });
    const { error: errorMessage, id: jobId, tileset }: MapboxJobStatus = await convertResponse.json();
    if (!convertResponse.ok) {
      error = errorMessage;
      loadingMessage = '';

      return;
    }

    loadingMessage = 'conversion job initiated...';

    await storeTileset(jobId, tileset);

    goto('/');
  }

  async function storeTileset(jobId: string, tileset: string) {
    floor = {
      ...floor,
      tileset,
      jobId,
      id: floor.id === 'new' ? nanoid(8) : floor.id,
      georeference: setGeoRefData(floor.georeference.bbox[2], floor.georeference.bbox[3], sourceCoordinates[3], sourceCoordinates[1]),
    };

    const updatedVenue: Venue = { ...venue, floors: [...venue.floors.filter(f => f.id !== floor.id), floor] };

    await fetch(`/api/venues/${venue.id}`, {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify(updatedVenue),
    });
  }
</script>

<div class="flex flex-row flex-1">
  <div class="basis-1/3 min-w-0 px-8 py-6">
    <div>
      <h2 class="mb-4">Georeference image</h2>
    </div>

    <div class="mb-4 text-sm text-gray-500">
      <p class="px-4 py-2 border-2">
        floor: {floor.number}
        {#if floor.filename}|{floor.filename}{/if}
        {#if floor.tileset}|{floor.tileset}{/if}
      </p>

      {#if loadingMessage}
        <p class="mt-2 text-gray-500">{loadingMessage}</p>
      {/if}
      {#if error}
        <p class="mt-2 text-red-500">error processing image: {error}</p>
      {/if}
    </div>

    <div class="flex justify-between">
      <div>
        <button on:click={() => imageInput.click()} type="button" class="btn btn-primary">select Image (jpg/png)</button>
        <input class="hidden" type="file" accept=".jpg, .jpeg, .png" on:change={setPreviewImage} bind:this={imageInput} />
      </div>

      <button disabled={!uploadedImage && !floor.previewImage} on:click={onConvertToGeotiffSelected} type="button" class="btn btn-primary">
        save
      </button>
    </div>
  </div>

  <div class="basis-2/3">
    <Map bind:this={mapComponent} bind:sourceCoordinates on:mapReady={e => mapReady(e.detail)} />
    <div class="absolute bottom-0 flex justify-between p-4 py-2 m-4">
      <small>{floor.georeference.bbox}</small>
    </div>
  </div>
</div>
