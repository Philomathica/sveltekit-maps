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
  export let venue: Venue;

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
</script>

<div class="flex flex-col h-full">
  <div class="px-8 py-6">{venue.id}</div>

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
