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
  import Map from '$lib/maps/Map.svelte';
  import MapMarker from '$lib/maps/MapMarker.svelte';

  export let signedUrl: string;
  export let fileUrl: string;

  let map: Map;
  let geotiffFile: File;
  let imageFile: File;
  let geotiffDataUrl: string;
  let imageDataUrl: string;
  let fileinputGeotiff: HTMLInputElement;
  let fileinputImage: HTMLInputElement;
  let loading = false;
  let error: string;

  function getCurrentPosition(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        map.goToLocation([position.coords.longitude, position.coords.latitude], true);
      });
    }
  }

  function onGeotiffSelected(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    geotiffFile = event.currentTarget.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(geotiffFile);
    reader.onload = (event: ProgressEvent<FileReader>) => {
      geotiffDataUrl = event.target.result as string;
      uploadGeotiff();
    };
  }

  function onImageSelected(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    imageFile = event.currentTarget.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = (event: ProgressEvent<FileReader>) => {
      imageDataUrl = event.target.result as string;
      uploadImage();
    };
  }

  /**
   * Upload image to presigned S3 url, create image from tileset, poll status and add image layer when tileset is created.
   */
  async function uploadGeotiff() {
    loading = true;
    error = null;

    await fetch(signedUrl, { body: geotiffFile, method: 'PUT' });

    const response = await fetch('/maps.json', { body: JSON.stringify({ fileUrl, name: geotiffFile.name }), method: 'POST' });
    const { message, id } = await response.json();

    if (!response.ok) {
      loading = false;
      error = message;

      return;
    }

    const { tileset } = await getUploadResultWhenDone(id);

    map.addLayer(tileset, { type: 'raster', url: `mapbox://${tileset}` }, { id: 'image-layer', type: 'raster', source: tileset });
    map.goToLocation([-85.595, 44.777], false, 10.25);

    loading = false;
  }

  async function getUploadResultWhenDone(id: string) {
    const response = await fetch(`/maps/status/${id}.json`);
    const result = await response.json();

    if (result.complete) {
      return result;
    }

    // wait for 2 seconds before querying status
    await new Promise(resolve => setTimeout(resolve, 2000));

    return await getUploadResultWhenDone(id);
  }

  function uploadImage() {
    map.addLayer(
      'image',
      {
        type: 'image',
        url: imageDataUrl,
        coordinates: [
          [-80.425, 46.437],
          [-71.516, 46.437],
          [-71.516, 37.936],
          [-80.425, 37.936],
        ],
      },
      { id: 'image-layer', type: 'raster', source: 'image' },
    );
  }
</script>

<svelte:head>
  <title>Sveltekit Maps</title>
</svelte:head>

<div class="flex gap-4 p-4">
  <div>
    <h1 class="text-4xl">Sveltekit Maps</h1>
    <button class="p-1 bg-gray-300 border rounded-md" on:click={getCurrentPosition}>Get Current Position</button>
  </div>

  <div on:click={() => fileinputGeotiff.click()}>
    <div class="flex flex-col items-center justify-center border cursor-pointer w-max">
      <img class="avatar" width="150" height="150" src={geotiffDataUrl ? geotiffDataUrl : 'https://i.stack.imgur.com/y9DpT.jpg'} alt="" />
      <button type="button" class="p-1 bg-gray-300 border rounded-md">Upload Geotiff</button>
      <input class="hidden" type="file" accept=".tiff" on:change={e => onGeotiffSelected(e)} bind:this={fileinputGeotiff} />

      {#if loading}
        <p>loading...</p>
      {/if}
      {#if error}
        <p>error processing image: {error}</p>
      {/if}
    </div>
  </div>

  <div on:click={() => fileinputImage.click()}>
    <div class="flex flex-col items-center justify-center border cursor-pointer w-max">
      <button type="button" class="p-1 bg-gray-300 border rounded-md">Upload Image</button>
      <input class="hidden" type="file" accept=".jpg, .jpeg, .png" on:change={e => onImageSelected(e)} bind:this={fileinputImage} />
    </div>
  </div>
</div>

<Map lat={35} lon={-84} zoom={3.5} bind:this={map}>
  <MapMarker lat={37.8225} lon={-122.0024} label="Svelte Body Shaping" />
  <MapMarker lat={33.8981} lon={-118.4169} label="Svelte Barbershop & Essentials" />
  <MapMarker lat={29.723} lon={-95.4189} label="Svelte Waxing Studio" />
  <MapMarker lat={28.3378} lon={-81.3966} label="Svelte 30 Nutritional Consultants" />
  <MapMarker lat={40.6483} lon={-74.0237} label="Svelte Brands LLC" />
  <MapMarker lat={40.6986} lon={-74.41} label="Svelte Medical Systems" />
</Map>
