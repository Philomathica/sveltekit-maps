<script context="module" lang="ts">
  import { emptyPlace } from './_empty-place';
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ params, fetch }) => {
    const response = await fetch(`/api/venues/${params.venueId}`);
    const venue: Venue = await response.json();
    const floor = venue.floors.find(f => f.id === params.floorId);

    if (!venue || !floor) {
      return { status: 404 };
    }

    if (params.placeId === 'new') {
      return { props: { venue, floor, place: emptyPlace } };
    }

    const place = floor.places.find(p => p.id === params.placeId);

    if (!place) {
      return { status: 404 };
    }

    return { props: { venue, floor, place } };
  };
</script>

<script lang="ts">
  import type { FloorLevel, Place, Venue } from '$lib/types';
  import { goto } from '$app/navigation';
  import { nanoid } from 'nanoid';

  export let venue: Venue;
  export let floor: FloorLevel;
  export let place: Place;

  async function submit() {
    place = { ...place, id: place.id === 'new' ? nanoid(8) : place.id };
    const updatedFloor = { ...floor, places: [...floor.places.filter(p => p.id !== place.id), place] };
    const updatedVenue: Venue = { ...venue, floors: [...venue.floors.filter(f => f.id !== floor.id), updatedFloor] };

    await fetch(`/api/venues/${venue.id}`, {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify(updatedVenue),
    });

    goto('/');
  }
</script>

<div class="flex flex-row flex-1">
  <div>
    <h2 class="mb-4">
      <span class="material-icons text-[32px] relative top-[5px] text-[#4264fb] mr-1">layers</span>Place
      <span class="mb-4 font-light text-gray-400">- #{place.id}</span>
    </h2>
  </div>

  <form on:submit|preventDefault={submit}>
    <label class="block mb-4 text-xs font-light text-gray-400 uppercase">
      Name
      <input type="text" bind:value={place.name} class="w-full" required />
    </label>

    <button type="submit" class="btn btn-primary w-full mt-8">save</button>
  </form>
</div>
