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
  <div class="flex gap-4 p-4">
    <div>
      <h2>Venue</h2>
      <p>Set (initial) longlat of venue</p>
      <label class="block w-full text-sm font-medium text-gray-700"
        >long
        <input
          type="number"
          class="px-3 py-2 mt-1 placeholder-gray-400 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 sm:text-sm focus:ring-1"
          bind:value={initLng}
        />
      </label>
      <label class="block w-full text-sm font-medium text-gray-700"
        >lat
        <input
          type="number"
          class="px-3 py-2 mt-1 placeholder-gray-400 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 sm:text-sm focus:ring-1"
          bind:value={initLat}
        />
      </label>

      <Floor {floors} on:delete={e => deleteFloor(e.detail)} />

      <h2>Map</h2>
    </div>
  </div>

  <div class="flex-1">
    <Map />
  </div>
</div>
