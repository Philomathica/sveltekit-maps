<script context="module" lang="ts">
  import { emptyFloor } from './_empty-floor';
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ params, fetch }) => {
    const venueResponse = await fetch(`/api/venues/${params.venueId}`);
    const venue = await venueResponse.json();

    if (!venue) {
      return { status: 404 };
    }

    if (params.floorId === 'new') {
      const venueBbox = bbox(venue.geometry) as [number, number, number, number];
      const sw = [venueBbox[0], venueBbox[1]];
      const ne = [venueBbox[2], venueBbox[3]];
      const newFloor = {
        ...emptyFloor,
        georeference: setGeoRefLocData(sw, ne, emptyFloor.georeference),
      };
      return { props: { venue, floor: newFloor } };
    }

    const floorResponse = await fetch(`/api/venues/${params.venueId}/floors/${params.floorId}?withImage=true`);
    const floor = await floorResponse.json();

    if (!floor) {
      return { status: 404 };
    }

    return { props: { venue, floor } };
  };
</script>

<script lang="ts">
  import Map from '$lib/components/maps/Map.svelte';
  import bbox from '@turf/bbox';
  import { setGeoRefLocData, getPositionInfo, setGeoRefDimensionData } from '$lib/helpers/georeference';
  import { convertFileToImage, convertImageToGeoTiff, sourceCoordinatesToGcpArr } from '$lib/helpers/gdal';

  import { goto } from '$app/navigation';
  import type { Map as MapboxMap } from 'mapbox-gl';
  import type { Floor, MapboxJobStatus, Venue } from '$lib/types';
  import type { LngLatBoundsLike } from 'mapbox-gl';

  export let venue: Venue;
  export let floor: Floor;

  let mapComponent: Map;
  let map: MapboxMap;
  let sourceCoordinates: number[][];
  let imageInput: HTMLInputElement;
  let uploadedImage: File;
  let loadingMessage = '';
  let error: string;

  async function initMap(mapInstance: MapboxMap) {
    map = mapInstance;
    fitToBounds(venue);

    if (floor.id !== 'new') {
      clearMap();
      // add existing
      map.addSource('sourceId', { type: 'image', url: floor.previewImage, coordinates: getPositionInfo(floor.georeference) });
      map.addLayer({ id: 'layerId', type: 'raster', source: 'sourceId', paint: { 'raster-fade-duration': 0 } });
      mapComponent.setMarkerAndListeners('sourceId', floor.georeference);

      // dataURLtoFile
      if (!floor.previewImage) {
        return;
      }
      uploadedImage = await fetch(floor.previewImage)
        .then(res => res.arrayBuffer())
        .then(buf => new File([buf], floor.filename, { type: floor.filetype }));
    }
  }

  async function setPreviewImage(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    uploadedImage = file;

    const image = await convertFileToImage(uploadedImage);
    const imageW = image.naturalWidth;
    const imageH = image.naturalHeight;

    // Clear map
    clearMap();

    // update previewImage
    const { type, name: filename } = uploadedImage;
    floor = { ...floor, previewImage: image.src, filename, filetype: type };

    if (floor.id === 'new') {
      // Extract data from venue to create intialGeoref
      const venueBbox = bbox(venue.geometry) as [number, number, number, number];
      const sw = [venueBbox[0], venueBbox[1]];
      const ne = [venueBbox[2], venueBbox[3]];
      const initialGeoref = setGeoRefDimensionData(imageW, imageH, setGeoRefLocData(sw, ne, floor.georeference));
      floor = { ...floor, georeference: initialGeoref };
    } else {
      const geoRefWithUpdatedBounds = setGeoRefDimensionData(imageW, imageH, floor.georeference);
      floor = { ...floor, georeference: geoRefWithUpdatedBounds };
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
      georeference: setGeoRefDimensionData(
        floor.georeference.bbox[2],
        floor.georeference.bbox[3],
        setGeoRefLocData(sourceCoordinates[3], sourceCoordinates[1], floor.georeference),
      ),
    };

    if (floor.id === 'new') {
      await fetch(`/api/venues/${venue.id}/floors`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(floor),
      });
    } else {
      await fetch(`/api/venues/${venue.id}/floors/${floor.id}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
        body: JSON.stringify(floor),
      });
    }
  }

  /** Map Helpers*/
  function fitToBounds(venue: Venue) {
    const boundingBox = bbox(venue.geometry) as LngLatBoundsLike;
    map.fitBounds(boundingBox, { animate: false, padding: { top: 150, bottom: 150, left: 150, right: 150 } });
  }

  function clearMap() {
    mapComponent.removeLayer('layerId');
    mapComponent.removeSource('sourceId');
    mapComponent.removeMarkers();
  }
</script>

<div class="flex flex-row flex-1">
  <div class="basis-1/3 min-w-0 px-8 py-6">
    <div>
      <h2 class="mb-4">
        <span class="material-icons text-[32px] relative top-[5px] text-[#4264fb] mr-1">layers</span>Floor
        <span class="mb-4 font-light text-gray-400">- #{floor.id}</span>
      </h2>
    </div>

    <label class="block mb-4 text-xs font-light text-gray-400 uppercase">
      FloorNumber
      <input type="number" bind:value={floor.number} class="w-full" required />
    </label>

    <button on:click={() => imageInput.click()} type="button" class="btn btn-secondary w-full py-4 mb-4 text-blue-600 border"
      >select Image (jpg/png)</button
    >
    <input class="hidden" type="file" accept=".jpg, .jpeg, .png" on:change={setPreviewImage} bind:this={imageInput} />

    <div class="p-4 text-xs font-light text-gray-500 bg-gray-200 border">
      {#if floor.filename} <div class="block mb-1"><span class="mb-4 font-bold">Filename: </span>{floor.filename}</div>{/if}
      {#if floor.tileset} <span class="font-bold">TilesetId: </span>{floor.tileset}{/if}
    </div>

    {#if loadingMessage}
      <p class="mt-2 text-gray-500">{loadingMessage}</p>
    {/if}
    {#if error}
      <p class="mt-2 text-red-500">error processing image: {error}</p>
    {/if}

    <button disabled={!uploadedImage && !floor.previewImage} on:click={onConvertToGeotiffSelected} type="button" class="btn btn-primary w-full mt-8">
      save
    </button>
  </div>

  <div class="basis-2/3">
    <Map bind:this={mapComponent} bind:sourceCoordinates on:mapReady={e => initMap(e.detail)} />
    <div class="absolute bottom-0 flex justify-between p-4 py-2 m-4">
      <small>{floor.georeference.bbox}</small>
    </div>
  </div>
</div>
