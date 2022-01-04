<script lang="ts" context="module">
  import type { FloorLevel } from '$lib/types';
  import type { Load } from '@sveltejs/kit';
  import { emptyFloor } from './_empty-floor';
  import { goto } from '$app/navigation';
  import { browser } from '$app/env';

  export const load: Load = async ({ page }) => {
    if (page.params.id === 'new') {
      return { props: { floor: emptyFloor } };
    }

    if (browser) {
      const floors: FloorLevel[] = window.localStorage.getItem('floor') ? JSON.parse(window.localStorage.getItem('floor')) : [];
      const floor = floors.find(floor => floor.id === page.params.id);

      return floor ? { props: { floor } } : goto('/');
    }

    return {};
  };
</script>

<script lang="ts">
  import Map from '$lib/maps/Map.svelte';
  import type mapbox from 'mapbox-gl';
  import { setGeoRefData, getPositionInfo } from '$lib/helpers/georeference';
  import { convertFileToImage, convertImageToGeoTiff } from '$lib/helpers/gdal';

  export let floor: FloorLevel;

  let mapComponent: Map;
  let map: mapbox.Map;
  let gcps: string[];
  let imageInput: HTMLInputElement;
  let uploadedImage: File;
  let loadingMessage = '';
  let error: string;
  let initLng = 6;
  let initLat = 4;

  function initMap(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    uploadedImage = event.currentTarget.files[0];

    const setupLayer = (image: HTMLImageElement) => {
      // todo extract from bbox of venue
      const sw: mapbox.LngLatLike = [0, 0];
      const ne: mapbox.LngLatLike = [initLng, initLat];
      const geoRefData = setGeoRefData(image.naturalWidth, image.naturalHeight, sw, ne);

      map.addSource('id', { type: 'image', url: image.src, coordinates: getPositionInfo(geoRefData) });
      map.addLayer({ id: 'id', type: 'raster', source: 'id', paint: { 'raster-fade-duration': 0 } });
      mapComponent.dragImage('id', geoRefData);
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

    const mapsResponse = await fetch('/maps.json');
    if (!mapsResponse.ok) {
      error = 'Failed to get signed url';
      loadingMessage = null;

      return;
    }

    const { signedUrl, fileUrl } = await mapsResponse.json();
    loadingMessage = 'uploading to S3...';
    await fetch(signedUrl, { body: geotiffFile, method: 'PUT' });

    loadingMessage = 'converting geotiff to tileset...';
    const convertResponse = await fetch('/maps.json', { body: JSON.stringify({ fileUrl, name: geotiffFile.name }), method: 'POST' });
    const { message, id } = await convertResponse.json();

    if (!convertResponse.ok) {
      error = message;
      loadingMessage = null;

      return;
    }

    const uploadResult = await getUploadResultWhenDone(id);

    if (uploadResult.error) {
      error = uploadResult.error;
      loadingMessage = null;

      return;
    }

    loadingMessage = 'done converting';

    map.addSource(uploadResult.tileset, { type: 'raster', url: `mapbox://${uploadResult.tileset}` });
    map.addLayer({ id: uploadResult.tileset, type: 'raster', source: uploadResult.tileset });
  }

  export async function getUploadResultWhenDone(id: string) {
    const response = await fetch(`/maps/status/${id}.json`);
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
  <div class="flex gap-4 justify-between p-4">
    <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">Georeference</h2>
    <button on:click={() => imageInput.click()} type="button" class="p-1 bg-gray-300 border rounded-md">Upload Image</button>
    <input class="hidden" type="file" accept=".jpg, .jpeg, .png" on:change={e => initMap(e)} bind:this={imageInput} />
  </div>

  {#if loadingMessage}
    <p>{loadingMessage}</p>
  {/if}
  {#if error}
    <p>error processing image: {error}</p>
  {/if}

  floor: {floor.number}

  <div class="flex-1">
    <Map bind:this={mapComponent} bind:gcps />
  </div>

  <button on:click={() => onConvertToGeotiffSelected()} type="button" class="p-1 bg-gray-300 border rounded-md">save</button>
</div>
