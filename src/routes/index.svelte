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

  import Venues from '$lib/components/venues/Venues.svelte';
  import MapMarker from '$lib/components/maps/MapMarker.svelte';

  export let venues: Venue[];

  $: selectedVenue = venues.find(v => v.id === selectedVenueId);

  let selectedVenueId = '';
  let map: Map;
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
    <Venues {venues} bind:selectedVenueId />
  </div>

  <div class="basis-2/3">
    <Map bind:this={map}>
      {#each venues as venue}
        <MapMarker lon={venue.marker[0]} lat={venue.marker[1]} />
      {/each}
    </Map>
  </div>
</div>
