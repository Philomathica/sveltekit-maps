<script context="module" lang="ts">
  import { emptyPlace } from './_empty-place';
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ params, fetch }) => {
    const [venueResponse, floorResponse] = await Promise.all([
      fetch(`/api/venues/${params.venueId}`),
      fetch(`/api/venues/${params.venueId}/floors/${params.floorId}?withImage=true`),
    ]);
    const [venue, floor] = await Promise.all([venueResponse.json(), floorResponse.json()]);

    if (!venue || !floor) {
      return { status: 404 };
    }

    if (params.placeId === 'new') {
      return { props: { venue, floor, place: emptyPlace } };
    }

    const placeResponse = await fetch(`/api/venues/${params.venueId}/floors/${params.floorId}/places/${params.placeId}`);
    const place: Venue = await placeResponse.json();

    if (!place) {
      return { status: 404 };
    }

    return { props: { venue, floor, place } };
  };
</script>

<script lang="ts">
  import type { Floor, Place, Venue } from '$lib/types';
  import { goto } from '$app/navigation';

  export let venue: Venue;
  export let floor: Floor;
  export let place: Place;

  async function submit() {
    if (place.id === 'new') {
      await fetch(`/api/venues/${venue.id}/floors/${floor.id}/places`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(place),
      });
    } else {
      await fetch(`/api/venues/${venue.id}/floors/${floor.id}/places/${place.id}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
        body: JSON.stringify(place),
      });
    }

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
