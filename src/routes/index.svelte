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
  import Map from '$lib/maps/Map.svelte';
  import { onMount } from 'svelte';

  import { convertImageToGeoTiff, setGeoRefData, getPositionInfo } from '$lib/helpers';
  import type mapboxgl from 'mapbox-gl';

  export let signedUrl: string;
  export let fileUrl: string;

  let loam: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let map: Map;
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
  });

  function onImageSelected(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    uploadedImage = event.currentTarget.files[0];

    let reader = new FileReader();
    reader.readAsDataURL(uploadedImage);
    reader.onload = async (event: ProgressEvent<FileReader>) => {
      const image = new Image();
      image.src = event.target.result as string;
      image.onload = () => {
        const imageDataUrl = event.target.result as string;

        // todo extract from bbox of venue
        const sw: mapboxgl.LngLatLike = [0, 0];
        const ne: mapboxgl.LngLatLike = [initLng, initLat];
        const geoRefData = setGeoRefData(image.naturalWidth, image.naturalHeight, sw, ne);

        map.addSourceWithLayer(
          'id',
          { type: 'image', url: `${imageDataUrl}`, coordinates: getPositionInfo(geoRefData) },
          { id: 'id', type: 'raster', source: 'id', paint: { 'raster-fade-duration': 0 } },
        );
        map.dragImage('id', geoRefData);
      };
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
    map.addSourceWithLayer(tileset, { type: 'raster', url: `mapbox://${tileset}` }, { id: tileset, type: 'raster', source: tileset });
    // map.flyTo([+upperLeftX, +upperLeftY]);
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
    <input type="number" bind:value={initLng} />
    <input type="number" bind:value={initLat} />
    <button on:click={() => imageInput.click()} type="button" class="p-1 bg-gray-300 border rounded-md">Upload Image</button>

    <button on:click={getLatestTileset} type="button" class="p-1 bg-gray-300 border rounded-md">Get latest tileset</button>
    <input class="hidden" type="file" accept=".jpg, .jpeg, .png" on:change={e => onImageSelected(e)} bind:this={imageInput} />
  </div>

  <div class="flex flex-col items-center justify-center p-1 border cursor-pointer w-max">
    <button on:click={() => onConvertToGeotiffSelected()} type="button" class="p-1 bg-gray-300 border rounded-md">Convert image to Geotiff</button>
  </div>

  {#if loadingMessage}
    <p>{loadingMessage}</p>
  {/if}
  {#if error}
    <p>error processing image: {error}</p>
  {/if}
</div>

<Map bind:this={map} bind:gcps />
