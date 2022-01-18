<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ fetch }) => {
    const responses = await Promise.all([fetch('/api/venues'), fetch('/api/floors'), fetch('/api/places')]);

    responses.map(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${response.url}`);
      }
    });

    const [venues, floors, places] = await Promise.all<[Venue[], FloorLevel[], Place[]]>(responses.map(r => r.json()));

    return { props: { venues, floors, places } };
  };
</script>

<script lang="ts">
  import type { Floor as FloorLevel, Place, Venue } from '$lib/types';
  import type { LngLatBoundsLike, Map as MapboxMap } from 'mapbox-gl';
  import Map from '$lib/components/maps/Map.svelte';
  import Floor from '$lib/components/floors/Floors.svelte';
  import FloorControl from '$lib/components/floors/FloorControl.svelte';
  import Venues from '$lib/components/venues/Venues.svelte';
  import MapMarker from '$lib/components/maps/MapMarker.svelte';
  import FitToVenuesBtn from '$lib/components/maps/FitToVenuesBtn.svelte';
  import Places from '$lib/components/places/Places.svelte';
  import bbox from '@turf/bbox';

  export let venues: Venue[];
  export let floors: FloorLevel[];
  export let places: Place[];

  $: selectedVenue = venues.find(v => v.id === selectedVenueId);
  $: selectedFloor = floors.find(v => v.id === selectedFloorId);
  $: selectedPlace = places.find(v => v.id === selectedPlaceId);
  $: floorsBySelectedVenue = floors.filter(f => f.venueId === selectedVenueId);
  $: placesBySelectedFloor = places.filter(f => f.floorId === selectedFloorId);
  $: mapInstance && selectedVenueId && configureVenue();
  $: mapInstance && selectedFloorId && configureFloor();
  $: mapInstance && selectedPlaceId && configurePlace();

  let selectedVenueId = '';
  let selectedFloorId = '';
  let selectedPlaceId = '';
  let previousSelectedVenueId = '';
  let mapInstance: MapboxMap;
  let map: Map;
  let loadingJobs: Promise<any>;

  function configureVenue() {
    if (!selectedVenue) {
      return;
    }

    if (previousSelectedVenueId) {
      floors
        .filter(f => f.venueId === previousSelectedVenueId)
        .forEach(floor => {
          map.removeLayer(floor.id);
          map.removeSource(floor.id);
        });
    }

    const minZoomLevel = selectedVenue.zoomLevel;
    floors
      .filter(f => f.venueId === selectedVenueId)
      .map(floor => {
        // below uses only the previewImage
        // mapInstance.addSource(floor.id, { type: 'image', url: floor.previewImage, coordinates: getPositionInfo(floor.georeference) });
        mapInstance.addSource(floor.id, { type: 'raster', url: `mapbox://${floor.tileset}` });
        mapInstance.addLayer({
          id: floor.id,
          type: 'raster',
          source: floor.id,
          paint: { 'raster-fade-duration': 0 },
          minzoom: minZoomLevel,
        });
      });

    previousSelectedVenueId = selectedVenueId;
    const boundingBox = bbox(selectedVenue.geometry) as LngLatBoundsLike;
    mapInstance.fitBounds(boundingBox, { padding: { top: 50, bottom: 50, left: 50, right: 50 }, animate: true, screenSpeed: 2 });
  }

  function configureFloor() {
    if (!selectedFloor) {
      return;
    }

    floors.filter(f => f.venueId === selectedVenueId).map(f => mapInstance.setLayoutProperty(f.id, 'visibility', 'none'));
    mapInstance.setLayoutProperty(selectedFloor.id, 'visibility', 'visible');
  }

  async function configurePlace() {
    if (!selectedPlace) {
      return;
    }
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
    floors
      .filter(f => f.venueId === venue.id)
      .forEach(floor => {
        map.removeLayer(floor.id);
        map.removeSource(floor.id);
      });
  }

  async function deleteFloor(floor: FloorLevel) {
    const confirm = window.confirm(`Are you sure you want to delete floor number ${floor.number}?`);
    if (!confirm || !selectedVenue) {
      return;
    }

    const response = await fetch(`/api/venues/${selectedVenueId}/floors/${floor.id}`, { method: 'DELETE' });
    if (!response.ok) {
      return window.alert(`Error deleting floor: ${await response.text()}`);
    }

    floors = floors.filter(f => f.id !== floor.id);

    map.removeLayer(floor.id);
    map.removeSource(floor.id);
  }

  async function deletePlace(place: Place) {
    const confirm = window.confirm(`Are you sure you want to delete place ${place.name}?`);
    if (!confirm || !selectedVenue || !selectedFloor) {
      return;
    }

    const response = await fetch(`/api/venues/${selectedVenueId}/floors/${selectedFloor.id}/places/${place.id}`, { method: 'DELETE' });
    if (!response.ok) {
      return window.alert(`Error deleting place: ${await response.text()}`);
    }

    places = places.filter(p => p.id !== place.id);
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
    <Venues {venues} bind:selectedVenueId on:delete={e => deleteVenue(e.detail)} />

    {#if selectedVenue}
      <h2 class="my-4">
        <span class="material-icons text-[28px] relative top-[5px] mr-2 text-[#4264fb]">layers</span>
        Floors
      </h2>
      <div class="flex justify-between">
        <h3 class="mb-3">
          {#if floorsBySelectedVenue.length}
            Select
          {:else}
            Add
          {/if}
          a floor for venue <strong>{selectedVenue.name}</strong>
        </h3>
        {#await loadingJobs}
          Loading job result...
        {/await}
      </div>
      <Floor bind:selectedFloorId floors={floorsBySelectedVenue} venueId={selectedVenueId} on:delete={e => deleteFloor(e.detail)} />
    {/if}

    {#if selectedVenue && selectedFloor}
      <h2 class="my-4">
        <span class="material-icons text-[28px] relative top-[5px] mr-2 text-[#4264fb]">layers</span>
        Places
      </h2>
      <div class="flex justify-between">
        <h3 class="mb-3">
          {#if placesBySelectedFloor.length}
            Select
          {:else}
            Add
          {/if}
          a place for floor number <strong>{selectedFloor.number}</strong>
        </h3>
      </div>
      <Places
        bind:selectedPlaceId
        places={placesBySelectedFloor}
        floorId={selectedFloorId}
        venueId={selectedVenueId}
        on:delete={e => deletePlace(e.detail)}
      />
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
      <FloorControl bind:selectedFloorId floors={floorsBySelectedVenue} />
    {/if}
  </div>
</div>
