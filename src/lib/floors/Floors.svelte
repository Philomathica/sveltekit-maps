<script lang="ts">
  import type { FloorLevel } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher<{ delete: FloorLevel }>();

  export let floors: FloorLevel[] = [];
  export let venueId: string;
</script>

<table class="smb-4 text-sm border-2 border-collapse table-auto">
  <thead class="bg-gray-50">
    <tr>
      <th>Id</th>
      <th>Floor</th>
      <th>Filename</th>
      <th>Tileset</th>
      <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
    </tr>
  </thead>
  <tbody class="bg-white">
    {#each floors as floor (floor.id)}
      <tr transition:fade|local>
        <td>{floor.id}</td>
        <td>{floor.number}</td>
        <td>{floor.filename}</td>
        <td>{floor.tileset}</td>
        <td class="text-right">
          <a class="btn btn-secondary text-blue-600" href="/venues/{venueId}/floors/{floor.id}">Edit</a>
          <button class="btn btn-secondary ml-2 text-red-600" on:click={() => dispatch('delete', floor)}>Delete</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<a class="btn btn-primary inline-block mb-6" href="/venues/{venueId}/floors/new">add Floor</a>

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
