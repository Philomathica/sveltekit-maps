<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ fetch }) => {
    const response = await fetch('/api/venues');

    if (!response.ok) {
      throw new Error(`Failed to fetch ${response.url}`);
    }

    const venues = await response.json();

    return { props: { venues } };
  };
</script>

<script lang="ts">
  import type { Venue } from '$lib/types';
  import Map from '$lib/components/maps/Map.svelte';
  import type { Map as MapboxMap } from 'mapbox-gl';

  import Venues from '$lib/components/venues/Venues.svelte';
  import MapMarker from '$lib/components/maps/MapMarker.svelte';
  import { routes } from '$lib/enum-types';
  import FitToVenuesBtn from '$lib/components/maps/FitToVenuesBtn.svelte';

  export let venues: Venue[];

  $: selectedVenue = venues.find(v => v.id === selectedVenueId);

  let selectedVenueId = '';
  let mapInstance: MapboxMap;

  async function initMap(mapInst: MapboxMap) {
    mapInstance = mapInst;
  }

  function focusOnVenue(venue: Venue) {
    mapInstance.flyTo({ center: [venue?.marker[0], venue?.marker[1]], zoom: venue.zoomLevel });
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
    <Venues {venues} bind:selectedVenueId on:venueSelect={e => focusOnVenue(e.detail)} />
    <a class="btn btn-primary block text-center mb-6" href={`/${routes.VENUES}/new`}>add venue</a>
  </div>

  <div class="basis-2/3">
    <Map on:mapReady={e => initMap(e.detail)}>
      {#if mapInstance}
        {#each venues as venue}
          <MapMarker lon={venue.marker[0]} lat={venue.marker[1]} on:markerSelect={() => focusOnVenue(venue)} />
        {/each}
        {#if venues.length > 1}
          <FitToVenuesBtn {venues} />
        {/if}
      {/if}
    </Map>
  </div>
</div>
