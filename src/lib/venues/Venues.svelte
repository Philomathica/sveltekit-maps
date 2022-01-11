<script lang="ts">
  import type { Venue } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher<{ venueSelect: Venue; delete: Venue }>();

  export let venues: Venue[] = [];

  let selectedVenue = venues[0];

  function selectVenue(venue: Venue) {
    selectedVenue = venue;
    dispatch('venueSelect', venue);
  }
</script>

{#if selectedVenue}
  <div class="overflow-x-auto">
    <table class="w-full mb-4 text-sm border-2 border-collapse table-fixed">
      <thead class="bg-gray-50">
        <tr>
          <th>Id</th>
          <th>Name</th>
          <th>LongLat</th>
          <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody class="bg-white">
        {#each venues as venue (venue.id)}
          <tr
            in:fade|local
            on:click={() => selectVenue(venue)}
            class:active={selectedVenue.id === venue.id}
            class="hover:bg-blue-100 hover:cursor-pointer"
          >
            <td>{venue.id}</td>
            <td>{venue.name}</td>
            <td>{venue.coordinates.lng} {venue.coordinates.lat}</td>
            <td class="text-right">
              <a class="btn btn-secondary text-blue-600" href="/venues/{venue.id}">Edit</a>
              <button type="button" class="btn btn-secondary ml-2 text-red-600" on:click|stopPropagation={() => dispatch('delete', venue)}>
                Delete
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<a class="btn btn-primary inline-block mb-6" href="/venues/new">add venue</a>

<style lang="postcss">
  .active {
    @apply bg-blue-200;
  }

  th {
    @apply bg-gray-50 px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase;
  }

  tr {
    @apply bg-white border-b;
  }

  td {
    @apply whitespace-nowrap px-6 py-2 text-sm text-gray-500;
  }
</style>
