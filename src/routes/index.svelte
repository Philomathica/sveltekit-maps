<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ fetch }) => {
    const response = await fetch('/api/floors');

    return { props: { floors: await response.json() } };
  };
</script>

<script lang="ts">
  import Map from '$lib/maps/Map.svelte';
  import Floor from '$lib/floors/Floor.svelte';
  import type { FloorLevel } from '$lib/types';
  import Nav from '$lib/nav/Nav.svelte';

  export let floors: FloorLevel[];

  let initLng = 6;
  let initLat = 4;

  async function deleteFloor(floor: FloorLevel) {
    const confirm = window.confirm(`Are you sure you want to delete ${floor.number}?`);

    if (!confirm) {
      return;
    }

    const response = await fetch(`/api/floors/${floor.id}`, { method: 'DELETE' });
    if (!response.ok) {
      return window.alert(`Error deleting tileset: ${await response.text()}`);
    }

    floors = floors.filter(f => f.id !== floor.id);
  }
</script>

<svelte:head>
  <title>Maps</title>
</svelte:head>

<div class="flex flex-col h-full">
  <Nav />

  <div class="flex gap-4 px-8 py-6">
    <div>
      <h2 class="mb-4">Venue</h2>
      <p class="text-gray-400">Set (initial) longlat of venue</p>
      <input
        type="number"
        class="px-3 py-2 mt-1 placeholder-gray-400 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 sm:text-sm focus:ring-1"
        bind:value={initLng}
      />
      <input
        type="number"
        class="px-3 py-2 mt-1 placeholder-gray-400 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 sm:text-sm focus:ring-1"
        bind:value={initLat}
      />

      <h2 class="mt-8 mb-4">Floors</h2>
      <Floor {floors} on:delete={e => deleteFloor(e.detail)} />
    </div>
  </div>

  <div class="flex-1"><Map /></div>
</div>
