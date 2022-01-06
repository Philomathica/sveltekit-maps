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

  async function deleteFloor(floor: FloorLevel) {
    const confirm = window.confirm(`Are you sure you want to delete ${floor.number}?`);

    if (!confirm) {
      return;
    }

    const response = await fetch(`/api/tilesets/${floor.tileset}`, { method: 'DELETE' });
    if (!response.ok) {
      return window.alert(`Error deleting tileset: ${await response.json()}`);
    }

    const localFloors = window.localStorage.getItem('floors');
    const storedFloors: FloorLevel[] = localFloors ? JSON.parse(localFloors) : [];
    const newFloors = storedFloors.filter(f => f.id !== floor.id);
    window.localStorage.setItem('floors', JSON.stringify(newFloors));
    floors = newFloors;
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
