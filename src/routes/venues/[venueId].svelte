<script context="module" lang="ts">
  import type { Venue } from '$lib/types';
  import type { Load } from '@sveltejs/kit';
  import { goto } from '$app/navigation';
  import { emptyVenue } from './_empty-venue';

  export const load: Load = async ({ params }) => {
    const venueId = params.venueId;

    if (params.venueId === 'new') {
      return { props: { venue: emptyVenue } };
    }

    const response = await fetch(`/api/venues/${venueId}`);
    const venue: Venue = await response.json();

    if (!emptyVenue) {
      return goto('/');
    }

    return { props: { venue } };
  };
</script>

<script lang="ts">
  import type { Map as MapboxMap } from 'mapbox-gl';
  import Map from '$lib/maps/Map.svelte';

  export let venue: Venue;
  let map: MapboxMap;

  let isSubmitting = false;

  async function createVenue() {
    isSubmitting = true;

    const response =
      venue.id === 'new'
        ? await fetch('/api/venues', { method: 'POST', body: JSON.stringify(venue), headers: { 'Content-Type': 'application/json' } })
        : await fetch(`/api/venues/${venue.id}`, { method: 'PUT', body: JSON.stringify(venue), headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) {
      console.error(response);
      isSubmitting = false;
    }

    goto('/');
  }

  async function initMap(mapInstance: MapboxMap) {
    map = mapInstance;
  }
</script>

<div class="flex flex-row h-full">
  <div class="px-8 py-6">
    <h2 class="mb-4">{venue.id}</h2>

    <form on:submit|preventDefault={createVenue} class="flex flex-col">
      <label>
        Name
        <input required type="text" name="name" bind:value={venue.name} placeholder="name" />
      </label>
      <label>
        LngLat
        <input required type="number" name="lng" bind:value={venue.coordinates.lng} placeholder="lng" />
        <input required type="number" name="lat" bind:value={venue.coordinates.lat} placeholder="lat" />
      </label>

      <button type="submit" class="btn btn-primary" disabled={isSubmitting}>Submit</button>
    </form>
  </div>

  <div class="flex-1">
    <Map on:mapReady={e => initMap(e.detail)} />
  </div>
</div>
