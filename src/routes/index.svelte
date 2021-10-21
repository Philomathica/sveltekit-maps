<script lang="ts">
  import Map from '$lib/components/Map.svelte';
  import MapMarker from '$lib/components/MapMarker.svelte';

  let map: Map;

  function getCurrentPosition(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        map.goToLocation([position.coords.longitude, position.coords.latitude]);
      });
    }
  }
</script>

<svelte:head>
  <title>Sveltekit Maps</title>
</svelte:head>

<div class="p-4">
  <h1 class="text-4xl">Sveltekit Maps</h1>
  <button class="p-1 bg-gray-300 border rounded-md" on:click={getCurrentPosition}>Get Current Position</button>
</div>

<Map lat={35} lon={-84} zoom={3.5} bind:this={map}>
  <MapMarker lat={37.8225} lon={-122.0024} label="Svelte Body Shaping" />
  <MapMarker lat={33.8981} lon={-118.4169} label="Svelte Barbershop & Essentials" />
  <MapMarker lat={29.723} lon={-95.4189} label="Svelte Waxing Studio" />
  <MapMarker lat={28.3378} lon={-81.3966} label="Svelte 30 Nutritional Consultants" />
  <MapMarker lat={40.6483} lon={-74.0237} label="Svelte Brands LLC" />
  <MapMarker lat={40.6986} lon={-74.41} label="Svelte Medical Systems" />
</Map>
