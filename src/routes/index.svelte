<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ fetch }) => {
    const response = await fetch('/api/venues');
    const venues: Venue[] = await response.json();

    return { props: { venues } };
  };
</script>

<script lang="ts">
  import type { LngLatBoundsLike, Map as MapboxMap } from 'mapbox-gl';
  import type { FloorLevel, Venue } from '$lib/types';
  import Map from '$lib/components/maps/Map.svelte';
  import Floor from '$lib/components/floors/Floors.svelte';
  import FloorControl from '$lib/components/floors/FloorControl.svelte';
  import Venues from '$lib/components/venues/Venues.svelte';
  import MapMarker from '$lib/components/maps/MapMarker.svelte';
  import FitToVenuesBtn from '$lib/components/maps/FitToVenuesBtn.svelte';
  import bbox from '@turf/bbox';

  export let venues: Venue[];

  let selectedVenue: Venue | undefined;
  let previousSelectedVenue: Venue | undefined;
  let selectedFloor: FloorLevel | undefined;
  let mapInstance: MapboxMap;
  let map: Map;
  let loadingJobs: Promise<any>;

  $: mapInstance && selectedVenue && configureVenue();
  $: mapInstance && selectedFloor && configureFloor();

  function configureVenue() {
    if (!selectedVenue) {
      return;
    }

    if (previousSelectedVenue) {
      previousSelectedVenue.floors.forEach(floor => {
        map.removeLayer(floor.id);
        map.removeSource(floor.id);
      });
    }

    const minZoomLevel = selectedVenue.zoomLevel;
    selectedVenue.floors.map(floor => {
      // below uses only the previewImage
      // map.addSource(f.id, { type: 'image', url: f.previewImage, coordinates: getPositionInfo(f.georeference) });
      mapInstance.addSource(floor.id, { type: 'raster', url: `mapbox://${floor.tileset}` });
      mapInstance.addLayer({
        id: floor.id,
        type: 'raster',
        source: floor.id,
        paint: { 'raster-fade-duration': 0 },
        minzoom: minZoomLevel,
      });
      mapInstance.setLayoutProperty(floor.id, 'visibility', 'none');
    });

    selectedFloor = selectedVenue.floors[0];
    previousSelectedVenue = selectedVenue;
    const boundingBox = bbox(selectedVenue.geometry) as LngLatBoundsLike;
    mapInstance.fitBounds(boundingBox, { padding: { top: 50, bottom: 50, left: 50, right: 50 }, animate: true, screenSpeed: 2 });
  }

  function configureFloor() {
    if (!selectedVenue || !selectedFloor) {
      return;
    }

    selectedVenue.floors.map(f => mapInstance.setLayoutProperty(f.id, 'visibility', 'none'));
    mapInstance.setLayoutProperty(selectedFloor.id, 'visibility', 'visible');
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
    selectedVenue = venues.length > 0 ? venues[0] : undefined;

    venue.floors.forEach(floor => {
      map.removeLayer(floor.id);
      map.removeSource(floor.id);
    });
  }

  async function deleteFloor(floor: FloorLevel) {
    const confirm = window.confirm(`Are you sure you want to delete floor number ${floor.number}?`);
    if (!confirm || !selectedVenue) {
      return;
    }

    const updatedVenue = { ...selectedVenue, floors: selectedVenue.floors.filter(f => f.id !== floor.id) };

    const response = await fetch(`/api/venues/${selectedVenue.id}`, {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify(updatedVenue),
    });

    if (!response.ok) {
      return window.alert(`Error deleting floor: ${await response.text()}`);
    }

    venues = [...venues.filter(v => v.id !== updatedVenue.id), updatedVenue];
    selectedVenue = updatedVenue;
    selectedFloor = selectedVenue.floors.length ? selectedVenue.floors[0] : undefined;

    map.removeLayer(floor.id);
    map.removeSource(floor.id);
  }
</script>

<svelte:head>
  <title>Maps</title>
</svelte:head>

<div class="flex flex-row flex-1">
  <div class="basis-1/3 min-w-0 px-8 py-6">
    <h2 class="mb-4">
      <span class="material-icons text-[32px] relative top-[5px] text-[#4264fb] mr-2">location_on</span>
      Venues
    </h2>
    <Venues {venues} bind:selectedVenue on:delete={e => deleteVenue(e.detail)} />

    {#if selectedVenue}
      <h2 class="my-4">
        <span class="material-icons text-[28px] relative top-[5px] mr-2 text-[#4264fb]">layers</span>
        Floors
      </h2>
      <div class="flex justify-between">
        <h3 class="mb-3">
          {#if selectedVenue.floors.length}
            Select
          {:else}
            Add
          {/if}
          a floor for venue <strong>{selectedVenue?.name}</strong>
        </h3>
        {#await loadingJobs}
          Loading job result...
        {/await}
      </div>
      <Floor bind:selectedFloor floors={selectedVenue.floors} venueId={selectedVenue.id} on:delete={e => deleteFloor(e.detail)} />
    {/if}
  </div>

  <div class="basis-2/3">
    <Map bind:this={map} on:mapReady={e => (mapInstance = e.detail)}>
      {#each venues as venue}
        <MapMarker lon={venue.marker[0]} lat={venue.marker[1]} on:markerSelect={() => (selectedVenue = venue)} />
      {/each}

      {#if venues.length > 1}
        <FitToVenuesBtn {venues} />
      {/if}
    </Map>

    {#if mapInstance && selectedVenue}
      <FloorControl bind:selectedFloor floors={selectedVenue.floors} />
    {/if}
  </div>
</div>
