<script lang="ts">
  import type { Venue } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher<{ venueSelect: Venue; delete: Venue }>();

  export let venues: Venue[] = [];
  export let selectedVenueId: string | undefined;

  $: venues.sort((a, b) => a.name.localeCompare(b.name));

  function updateSelectedVenueId(event: MouseEvent & { currentTarget: EventTarget & HTMLTableRowElement }, venueId: string) {
    if (event.target === event.currentTarget || [...event.currentTarget.children].some(c => c === event.target)) {
      selectedVenueId = venueId;
      dispatch(
        'venueSelect',
        venues.find(v => v.id === selectedVenueId),
      );
    }
  }
</script>

{#if venues.length}
  <h3 class="mb-3">Select a venue</h3>

  <div class="overflow-x-auto">
    <table class="w-full mb-4 text-sm border border-collapse table-auto">
      <thead class="bg-gray-50">
        <tr>
          <th>Name</th>
          <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody class="bg-white">
        {#each venues as venue (venue.id)}
          <tr
            in:fade|local
            on:click={e => updateSelectedVenueId(e, venue.id)}
            class:active={selectedVenueId === venue.id}
            class="hover:bg-blue-100 hover:cursor-pointer"
          >
            <td>{venue.name}</td>
            <td class="text-right">
              <a class="btn btn-secondary inline-block my-1 text-blue-600" href="/venues/{venue.id}" sveltekit:prefetch>Edit</a>
              <!-- <button type="button" class="btn btn-secondary ml-2 text-red-600" on:click={() => dispatch('delete', venue)}> Delete </button> -->
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
