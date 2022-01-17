<script lang="ts">
  import type { Place } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher<{ placeSelect: Place; delete: Place }>();

  export let places: Place[] = [];
  export let venueId: string;
  export let floorId: string;
  export let selectedPlace: Place | undefined;

  $: places.sort((a, b) => a.name.localeCompare(b.name));

  function updateSelectedPlaceOnRowClick(event: MouseEvent & { currentTarget: EventTarget & HTMLTableRowElement }, place: Place) {
    if (event.target === event.currentTarget || [...event.currentTarget.children].some(c => c === event.target)) {
      selectedPlace = place;
    }
  }
</script>

{#if selectedPlace}
  <div class="overflow-x-auto">
    <table class="w-full mb-4 text-sm border border-collapse table-auto">
      <thead class="bg-gray-50">
        <tr>
          <th>Place</th>
          <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody class="bg-white">
        {#each places as place (place.id)}
          <tr
            in:fade|local
            on:click={e => updateSelectedPlaceOnRowClick(e, place)}
            class:active={selectedPlace.id === place.id}
            class="hover:bg-blue-100 hover:cursor-pointer"
          >
            <td>{place.name}</td>
            <td class="text-right">
              <a class="btn btn-secondary ml-2 text-blue-600" href="/venues/{venueId}/floors/{floorId}/places/{place.id}" sveltekit:prefetch>Edit</a>
              <button type="button" class="btn btn-secondary ml-2 text-red-600" on:click={() => dispatch('delete', place)}>Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<a class="btn btn-primary inline-block mb-6" href="/venues/{venueId}/floors/{floorId}/places/new">add Place</a>

<style lang="postcss">
  .active {
    @apply bg-blue-400;
  }
  .active td {
    @apply text-white;
  }
</style>
