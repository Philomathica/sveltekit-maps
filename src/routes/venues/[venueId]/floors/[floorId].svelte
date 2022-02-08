<script lang="ts">
  import type { Map as MapboxMap } from 'mapbox-gl';
  import type { LngLatBoundsLike } from 'mapbox-gl';
  import bbox from '@turf/bbox';

  import type { Floor, MapboxJobStatus, Venue } from '$lib/types';
  import Map from '$lib/components/maps/Map.svelte';
  import { goto } from '$app/navigation';
  import { setGeoRefLocData, getPositionInfo, setGeoRefDimensionData } from '$lib/helpers/georeference';
  import { convertFileToImage, convertImageToGeoTiff, sourceCoordinatesToGcpArr } from '$lib/helpers/gdal';
  import { routes } from '$lib/enum-types';

  export let venue: Venue;
  export let floor: Floor;

  let mapComponent: Map;
  let mapInstance: MapboxMap;
  let sourceCoordinates: number[][];
  let imageInput: HTMLInputElement;
  let uploadedImage: File;
  let loadingMessage = '';
  let error: string;

  async function initMap(mapInst: MapboxMap) {
    mapInstance = mapInst;
    fitToBounds(venue);

    if (floor.id !== 'new') {
      clearMap();
      // add existing
      mapInstance.addSource('sourceId', { type: 'image', url: floor.previewImage, coordinates: getPositionInfo(floor.georeference) });
      mapInstance.addLayer({ id: 'layerId', type: 'raster', source: 'sourceId', paint: { 'raster-fade-duration': 0 } });
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

    mapInstance.addSource('sourceId', { type: 'image', url: floor.previewImage, coordinates: getPositionInfo(floor.georeference) });
    mapInstance.addLayer({ id: 'layerId', type: 'raster', source: 'sourceId', paint: { 'raster-fade-duration': 0 } });

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
    const mapsResponse = await fetch('/tilesets/s3');

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
    const convertResponse = await fetch(`/tilesets/${floor.tilesetId}`, {
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

    goto(`/venues/${venue.id}/floors`);
  }

  async function storeTileset(jobId: string, tilesetId: string) {
    floor = {
      ...floor,
      tilesetId,
      jobId,
      georeference: setGeoRefDimensionData(
        floor.georeference.bbox[2],
        floor.georeference.bbox[3],
        setGeoRefLocData(sourceCoordinates[3], sourceCoordinates[1], floor.georeference),
      ),
    };

    if (floor.id === 'new') {
      await fetch(`/venues/${venue.id}/floors`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(floor),
      });
    } else {
      await fetch(`/venues/${venue.id}/floors/${floor.id}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
        body: JSON.stringify(floor),
      });
    }
  }

  /** Map Helpers*/
  function fitToBounds(venue: Venue) {
    const boundingBox = bbox(venue.geometry) as LngLatBoundsLike;
    mapInstance.fitBounds(boundingBox, { animate: false, padding: { top: 150, bottom: 150, left: 150, right: 150 } });
  }

  function clearMap() {
    mapComponent.removeLayer('layerId');
    mapComponent.removeSource('sourceId');
    mapComponent.removeMarkers();
  }

  async function deleteFloor(floor: Floor) {
    const confirm = window.confirm(`Are you sure you want to delete floor number ${floor.number}?`);
    if (!confirm) {
      return;
    }

    const response = await fetch(`/venues/${floor.venueId}/floors/${floor.id}`, { method: 'DELETE' });
    if (!response.ok) {
      return window.alert(`Error deleting floor: ${await response.text()}`);
    }

    mapInstance.removeLayer(floor.id);
    mapInstance.removeSource(floor.id);

    goto('/floors');
  }
</script>

<div class="flex flex-row flex-1">
  <div class="flex flex-col w-96 px-8 py-6">
    <h2 class="flex items-center my-4">
      <span class="material-icons text-[32px] top-[2px] relative text-[#4264fb] mr-2">layers</span>Floor: #{floor.id}
      <span class="material-icons text-[16px] relative top-[5px] text-gray-300 ml-auto" on:click={() => deleteFloor(floor)}>delete</span>
    </h2>

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
      {#if floor.tilesetId} <span class="font-bold">TilesetId: </span>{floor.tilesetId}{/if}
    </div>

    {#if loadingMessage}
      <p class="mt-2 text-gray-500">{loadingMessage}</p>
    {/if}
    {#if error}
      <p class="mt-2 text-red-500">error processing image: {error}</p>
    {/if}

    <div class="flex">
      <button
        type="button"
        class="basis-1/3 btn btn-primary-outline w-full mt-8 text-gray-400 mr-4"
        on:click={() => goto(`/${routes.VENUES}/${venue.id}/${routes.FLOORS}`)}>Cancel</button
      >
      <button
        type="button"
        class="btn btn-primary w-full mt-8"
        disabled={!uploadedImage && !floor.previewImage}
        on:click={onConvertToGeotiffSelected}
      >
        save
      </button>
    </div>
  </div>

  <div class="flex-1">
    <Map bind:this={mapComponent} bind:sourceCoordinates on:mapReady={e => initMap(e.detail)} />
    <div class="absolute bottom-0 flex justify-between p-4 py-2 m-4">
      <small>{floor.georeference.bbox}</small>
    </div>
  </div>
</div>
