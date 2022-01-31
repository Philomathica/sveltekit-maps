<script lang="ts">
  import { routes } from '$lib/enum-types';

  import type { Place } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher<{ placeSelect: string }>();

  export let venueId: string;
  export let places: Place[] = [];
  export let selectedPlaceId = '';

  $: sortedPlaces = [...places].sort((a, b) => a.name.localeCompare(b.name));
  $: {
    selectedPlaceId = sortedPlaces[0]?.id;
    dispatch('placeSelect', selectedPlaceId);
  }
  $: places.sort((a, b) => a.name.localeCompare(b.name));

  function updateSelectedPlaceOnRowClick(event: MouseEvent & { currentTarget: EventTarget & HTMLTableRowElement }, placeId: string) {
    if (event.target === event.currentTarget || [...event.currentTarget.children].some(c => c === event.target)) {
      selectedPlaceId = placeId;
    }
  }
</script>

{#if selectedPlaceId}
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
            on:click={e => updateSelectedPlaceOnRowClick(e, place.id)}
            class:active={selectedPlaceId === place.id}
            class="hover:bg-blue-100 hover:cursor-pointer"
          >
            <td>{place.name}</td>
            <td class="text-right">
              <a
                class="btn btn-secondary inline-block ml-2 text-blue-600"
                href="/{routes.VENUES}/{venueId}/{routes.PLACES}/{place.id}"
                sveltekit:prefetch>Edit</a
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style lang="postcss">
  .active {
    @apply bg-blue-400;
  }
  .active td {
    @apply text-white;
  }
</style>
