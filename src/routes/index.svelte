<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ fetch }) => {
    const response = await fetch('/api/venues');

    return { props: { venues: await response.json() } };
  };
</script>

<script lang="ts">
  import type { Map as MapboxMap } from 'mapbox-gl';
  import Map from '$lib/maps/Map.svelte';
  import Floor from '$lib/floors/Floors.svelte';
  import type { FloorLevel, Venue } from '$lib/types';
  import FloorControl from '$lib/floors/FloorControl.svelte';
  import Venues from '$lib/venues/Venues.svelte';

  export let venues: Venue[];

  let selectedVenue: Venue | undefined = venues.length > 0 ? venues[0] : undefined;
  let map: MapboxMap;

  async function deleteVenue(venue: Venue) {
    const confirm = window.confirm(`Are you sure you want to delete ${venue.name}?`);
    if (!confirm) {
      return;
    }

    const response = await fetch(`/api/venues/${venue.id}`, { method: 'DELETE' });
    if (!response.ok) {
      return window.alert(`Error deleting venue: ${await response.text()}`);
    }

    venues = venues.filter(v => v.id !== venue.id);
  }

  async function deleteFloor(floor: FloorLevel) {
    const confirm = window.confirm(`Are you sure you want to delete ${floor.number}?`);
    if (!confirm || !selectedVenue) {
      return;
    }

    const response = await fetch(`/api/venues/${selectedVenue.id}/floors/${floor.id}`, { method: 'DELETE' });
    if (!response.ok) {
      return window.alert(`Error deleting floor: ${await response.text()}`);
    }

    const foundVenue = venues.find(v => v.floors);
    if (!foundVenue) {
      return;
    }

    const updatedVenue = { ...foundVenue, floors: foundVenue.floors.filter(f => f.id !== floor.id) };
    venues = [...venues.filter(v => v.id !== foundVenue.id), updatedVenue];
  }

  async function initMap(mapInstance: MapboxMap) {
    map = mapInstance;

    if (!selectedVenue?.floors.length) {
      return;
    }

    selectedVenue.floors.map(floor => {
      // below uses only the previewImage
      // map.addSource(f.id, { type: 'image', url: f.previewImage, coordinates: getPositionInfo(f.georeference) });
      map.addSource(floor.id, { type: 'raster', url: `mapbox://${floor.tileset}` });
      map.addLayer({ id: floor.id, type: 'raster', source: floor.id, paint: { 'raster-fade-duration': 0 } });
      map.setLayoutProperty(floor.id, 'visibility', 'none');
    });
  }

  function toggleFloor(floorId: string) {
    if (!selectedVenue) {
      return;
    }

    selectedVenue.floors.map(f => map.setLayoutProperty(f.id, 'visibility', 'none'));
    map.setLayoutProperty(floorId, 'visibility', 'visible');
  }
</script>

<svelte:head>
  <title>Maps</title>
</svelte:head>

<div class="flex flex-row flex-1">
  <div class="px-8 py-6">
    <h2 class="mb-4">Venues</h2>
    <Venues {venues} on:delete={e => deleteVenue(e.detail)} />

    {#if venues}
      <h2 class="mt-8 mb-4">Floors</h2>
      <select bind:value={selectedVenue}>
        {#each venues as venue (venue.id)}
          <option value={venue}>{venue.name}</option>
        {/each}
      </select>
    {/if}

    {#if selectedVenue}
      <Floor floors={selectedVenue.floors} venueId={selectedVenue.id} on:delete={e => deleteFloor(e.detail)} />
    {/if}
  </div>

  <div class="flex-1">
    {#if map && selectedVenue?.floors.length}
      <FloorControl floors={selectedVenue.floors} on:floorSelect={e => toggleFloor(e.detail)} />
    {/if}
    <Map on:mapReady={e => initMap(e.detail)} />
  </div>
</div>
