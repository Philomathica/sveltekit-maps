<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ fetch }) => {
    const response = await fetch('/api/venues');

    return { props: { venues: await response.json() } };
  };
</script>

<script lang="ts">
  import type { Map as MapboxMap } from 'mapbox-gl';
  import type { FloorLevel, Venue } from '$lib/types';
  import Map from '$lib/maps/Map.svelte';
  import Floor from '$lib/floors/Floors.svelte';
  import FloorControl from '$lib/floors/FloorControl.svelte';
  import Venues from '$lib/venues/Venues.svelte';

  export let venues: Venue[];

  let selectedVenue: Venue | undefined = venues[0];
  let selectedFloor: FloorLevel | undefined = venues[0]?.floors[0];
  let map: MapboxMap;

  $: selectedVenue && resetSelectedFloor();

  function resetSelectedFloor() {
    selectedFloor = selectedVenue?.floors[0];
  }

  async function deleteVenue(venue: Venue) {
    const confirm = window.confirm(`Are you sure you want to delete venue ${venue.name}?`);
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
    const confirm = window.confirm(`Are you sure you want to delete floor number ${floor.number}?`);
    if (!confirm || !selectedVenue) {
      return;
    }

    const updatedVenue = { ...selectedVenue, floors: selectedVenue.floors.filter(f => f.id !== floor.id) };

    await fetch(`/api/venues/${selectedVenue.id}`, {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify(updatedVenue),
    });

    venues = [...venues.filter(v => v.id !== updatedVenue.id), updatedVenue];
    selectedVenue = venues.length > 0 ? venues[0] : undefined;
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
  <div class="basis-1/3 min-w-0 px-8 py-6">
    <h2 class="mb-4">Venues</h2>
    <h3 class="mb-3">Select a venue</h3>
    <Venues {venues} on:venueSelect={event => (selectedVenue = event.detail)} on:delete={e => deleteVenue(e.detail)} />

    {#if selectedVenue}
      <h2 class="my-4">Floors</h2>
      <h3 class="mb-3">Select a Floor for venue <strong>{selectedVenue?.name}</strong></h3>
      <Floor bind:selectedFloor floors={selectedVenue.floors} venueId={selectedVenue.id} on:delete={e => deleteFloor(e.detail)} />
    {/if}
  </div>

  <div class="basis-2/3">
    <Map on:mapReady={e => initMap(e.detail)} />

    {#if map && selectedVenue?.floors.length}
      <FloorControl floors={selectedVenue.floors} on:floorSelect={e => toggleFloor(e.detail)} />
    {/if}
  </div>
</div>
