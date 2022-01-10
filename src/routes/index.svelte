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
  import type mapbox from 'mapbox-gl';
  import FloorControl from '$lib/floors/FloorControl.svelte';

  export let floors: FloorLevel[];

  let initLng = 6;
  let initLat = 4;
  let map: mapbox.Map;

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

  async function mapReady(mapInstance: mapbox.Map) {
    map = mapInstance;
    if (floors.length) {
      renderFloors(floors);
    }
  }

  function renderFloors(floors: FloorLevel[]) {
    floors.map(f => {
      // below uses only the previewImage
      // map.addSource(f.id, { type: 'image', url: f.previewImage, coordinates: getPositionInfo(f.georeference) });
      map.addSource(f.id, { type: 'raster', url: `mapbox://${f.tileset}` });
      map.addLayer({ id: f.id, type: 'raster', source: f.id, paint: { 'raster-fade-duration': 0 } });
      map.setLayoutProperty(f.id, 'visibility', 'none');
    });
  }

  function toggleFloor(floorId: string) {
    floors.map(f => map.setLayoutProperty(f.id, 'visibility', 'none'));
    map.setLayoutProperty(floorId, 'visibility', 'visible');
  }
</script>

<svelte:head>
  <title>Maps</title>
</svelte:head>

<div class="flex flex-col flex-1">
  <div class="px-8 py-6">
    <div>
      <h2 class="mb-4">Venue</h2>
      <p class="text-gray-400">Set (initial) longlat of venue</p>
      <input
        type="number"
        class="focus:outline-none focus:border-sky-500 focus:ring-sky-500 sm:text-sm focus:ring-1 px-3 py-2 mt-1 placeholder-gray-400 bg-white border border-gray-300 rounded-md shadow-sm"
        bind:value={initLng}
      />
      <input
        type="number"
        class="focus:outline-none focus:border-sky-500 focus:ring-sky-500 sm:text-sm focus:ring-1 px-3 py-2 mt-1 placeholder-gray-400 bg-white border border-gray-300 rounded-md shadow-sm"
        bind:value={initLat}
      />

      <h2 class="mt-8 mb-4">Floors</h2>
      <Floor {floors} on:delete={e => deleteFloor(e.detail)} />
    </div>
  </div>

  <div class="flex-1">
    {#if map && floors}
      <FloorControl {floors} on:floorSelect={e => toggleFloor(e.detail)} />
    {/if}
    <Map on:mapReady={e => mapReady(e.detail)} />
  </div>
</div>
