<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ fetch }) => {
    const url = `/maps.json`;
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
  let file: File;
  let image: string;
  let fileinput: HTMLInputElement;
  let loading = false;

  function getCurrentPosition(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        map.goToLocation([position.coords.longitude, position.coords.latitude], true);
      });
    }
  }

  function onFileSelected(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    file = event.currentTarget.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (event: ProgressEvent<FileReader>) => {
      image = event.target.result as string;
      uploadImage();
    };
  }

  async function uploadImage() {
    loading = true;

    await fetch(signedUrl, { body: file, method: 'PUT' });

    const mapsResponse = await fetch('/maps.json', { body: JSON.stringify({ fileUrl, name: file.name }), method: 'POST' });
    const { id } = await mapsResponse.json();
    const { tileset } = await getUploadResultWhenDone(id);

    map.addImageLayer(tileset, { type: 'raster', url: `mapbox://${tileset}` }, { id: 'image-layer', type: 'raster', source: tileset });
    map.goToLocation([-85.595, 44.777], false, 10.25);

    loading = false;
  }

  async function getUploadResultWhenDone(uploadId: string) {
    const uploadStatusResponse = await fetch('/uploads.json', { method: 'POST', body: JSON.stringify({ uploadId }) });
    const uploadStatusResult = await uploadStatusResponse.json();

    if (uploadStatusResult.complete) {
      return uploadStatusResult;
    }

    // wait for 2 seconds before refetching status
    await new Promise(resolve => setTimeout(resolve, 2000));

    return await getUploadResultWhenDone(uploadId);
  }
</script>

<svelte:head>
  <title>Sveltekit Maps</title>
</svelte:head>

<div class="flex p-4 gap-4">
  <div>
    <h1 class="text-4xl">Sveltekit Maps</h1>
    <button class="p-1 bg-gray-300 border rounded-md" on:click={getCurrentPosition}>Get Current Position</button>
  </div>

  <div>
    <div class="flex flex-col justify-center items-center border w-max">
      <h1 class="text-center">Upload Image</h1>

      {#if image}
        <img class="avatar" width="150" height="150" src={image} alt="d" />
      {:else}
        <img class="avatar" width="150" height="150" src="https://cdn4.iconfinder.com/data/icons/small-n-flat/24/user-alt-512.png" alt="" />
      {/if}
      <button class="p-1 bg-gray-300 border rounded-md" on:click={() => fileinput.click()}>Upload Image</button>
      <input class="hidden" type="file" accept=".jpg, .jpeg, .png, .tiff" on:change={e => onFileSelected(e)} bind:this={fileinput} />

      {#if loading}
        <p>loading...</p>
      {/if}
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
