<script lang="ts">
    import type { Venue } from '$lib/types';
    import { createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';
  
    const dispatch = createEventDispatcher<{ delete: Venue }>();
  
    export let venues: Venue[] = [];
  </script>
  
  <table class="smb-4 text-sm border-2 border-collapse table-auto">
    <thead class="bg-gray-50">
      <tr>
        <th>Id</th>
        <th>Name</th>
        <th>Coordinates</th>
      </tr>
    </thead>
    <tbody class="bg-white">
      {#each venues as venue (venue.id)}
        <tr transition:fade|local>
          <td>{venue.id}</td>
          <td>{venue.name}</td>
          <td>{venue.coordinates[0]} {venue.coordinates[1]}</td>
          <td class="text-right">
            <a class="btn btn-secondary text-blue-600" href="/venues/{venue.id}">Edit</a>
            <button class="btn btn-secondary ml-2 text-red-600" on:click={() => dispatch('delete', venue)}>Delete</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  
  <a class="btn btn-primary inline-block mb-6" href="/venues/new">add venue</a>
  
  <style lang="postcss">
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