<script lang="ts">
  import { onMount } from 'svelte';

  import Map from '$lib/maps/Map.svelte';
  import Floor from '$lib/floors/Floor.svelte';
  import type { FloorLevel } from '$lib/types';

  let initLng = 6;
  let initLat = 4;
  let floors: FloorLevel[] = [];

  onMount(async () => {
    floors = window.localStorage.getItem('floors') ? JSON.parse(window.localStorage.getItem('floors')) : [];
  });
</script>

<svelte:head>
  <title>Maps</title>
</svelte:head>

<div class="flex flex-col h-full">
  <div class="flex gap-4 p-4">
    <div>
      <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">Venue</h2>
      <p>Set (initial) longlat of venue</p>
      <label class="block w-full text-sm font-medium text-gray-700"
        >long
        <input
          type="number"
          class="mt-1 px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 rounded-md sm:text-sm focus:ring-1"
          bind:value={initLng}
        />
      </label>
      <label class="block w-full text-sm font-medium text-gray-700"
        >lat
        <input
          type="number"
          class="mt-1 px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 rounded-md sm:text-sm focus:ring-1"
          bind:value={initLat}
        />
      </label>

      <Floor {floors} />

      <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight mt-4">Map</h2>
    </div>
  </div>

  <div class="flex-1">
    <Map />
  </div>
</div>
