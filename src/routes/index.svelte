<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ fetch }) => {
    const url = '/maps.json';
    const res: Response = await fetch(url);

    if (res.ok) {
      return { props: await res.json() };
    }

    return { status: res.status, error: new Error(`Could not load ${url}`) };
  };
</script>

<script lang="ts">
  import cookie from 'cookie';
  import type mapbox from 'mapbox-gl';
  import { onMount } from 'svelte';

  import Map from '$lib/maps/Map.svelte';
  import { convertImageToGeoTiff } from '$lib/helpers/gdal';
  import { setGeoRefData, getPositionInfo } from '$lib/helpers/georeference';

  export let signedUrl: string;
  export let fileUrl: string;

  let loam: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let mapComponent: Map;
  let map: mapbox.Map;
  let imageInput: HTMLInputElement;
  let loadingMessage = '';
  let gcps: string[];
  let initLng = 6;
  let initLat = 4;
  let error: string;
  let uploadedImage: File;

  onMount(async () => {
    loam = await import('loam');
    loam.initialize(window.location.origin);

    return () => loam.reset();
  });

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

  function convertFileToImage(image: File, callback: (image: HTMLImageElement) => void) {
    let reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => callback(img);
    };
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
    loadingMessage = 'uploading to S3...';
    error = null;

    await fetch(signedUrl, { body: geotiffFile, method: 'PUT' });

    loadingMessage = 'converting geotiff to tileset...';
    const response = await fetch('/maps.json', { body: JSON.stringify({ fileUrl, name: geotiffFile.name }), method: 'POST' });
    const { message, id } = await response.json();

    if (!response.ok) {
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
    getCustomImageTileset(uploadResult.tileset);
  }

  async function getUploadResultWhenDone(id: string) {
    const response = await fetch(`/maps/status/${id}.json`);
    const result = await response.json();

    if (result.complete || result.error) {
      return result;
    }

    // wait for 2 seconds before querying status
    await new Promise(resolve => setTimeout(resolve, 2000));

    return await getUploadResultWhenDone(id);
  }

  function getCustomImageTileset(tileset: string): void {
    map.addSource(tileset, { type: 'raster', url: `mapbox://${tileset}` });
    map.addLayer({ id: tileset, type: 'raster', source: tileset });
  }

  function getLatestTileset() {
    const cookies = cookie.parse(document.cookie || '');
    if (cookies.tileset) {
      getCustomImageTileset(cookies.tileset);
    }
  }
</script>

<svelte:head>
  <title>Maps</title>
</svelte:head>

<div class="flex gap-4 p-4">
  <div>
    <h1 class="text-4xl">Maps</h1>
    <h4>set initial longlat</h4>
    <input type="number" class="border-2" bind:value={initLng} />
    <input type="number" class="border-2" bind:value={initLat} />
    <button on:click={getLatestTileset} type="button" class="p-1 bg-gray-300 border rounded-md">Get latest tileset</button>

    <button on:click={() => imageInput.click()} type="button" class="p-1 bg-gray-300 border rounded-md">Upload Image</button>
    <input class="hidden" type="file" accept=".jpg, .jpeg, .png" on:change={e => initMap(e)} bind:this={imageInput} />

    <button disabled={!gcps?.length} on:click={() => onConvertToGeotiffSelected()} type="button" class="p-1 bg-gray-300 border rounded-md">
      Convert image to Geotiff
    </button>
  </div>

  {#if loadingMessage}
    <p>{loadingMessage}</p>
  {/if}
  {#if error}
    <p>error processing image: {error}</p>
  {/if}
</div>

<Map bind:this={mapComponent} bind:map bind:gcps />
