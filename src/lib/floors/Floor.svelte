<script lang="ts">
  import type { FloorLevel } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher<{ delete: FloorLevel }>();

  export let floors: FloorLevel[] = [];
</script>

<table>
  <thead>
    <tr>
      <th>Id</th>
      <th>Floor</th>
      <th>Filename</th>
      <th>Tileset</th>
      <th class="relative px-6 py-3">
        <span class="sr-only">Actions</span>
      </th>
    </tr>
  </thead>
  <tbody>
    {#each floors as floor (floor.id)}
      <tr transition:fade|local>
        <td>{floor.id}</td>
        <td>{floor.number}</td>
        <td>{floor.filename}</td>
        <td>{floor.tileset}</td>
        <td class="text-right">
          <a class="text-blue-600 btn btn-secondary" href="/floors/{floor.id}">Edit</a>
          <button class="ml-2 text-red-600 btn btn-secondary" on:click={() => dispatch('delete', floor)}>Delete</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<a class="inline-block mb-6 btn btn-primary" href="/floors/new">add Floor</a>

<style lang="postcss">
  table {
    @apply mb-4 text-sm border-2 border-collapse table-auto min-w-full;
  }
  thead th {
    @apply bg-gray-50;
  }
  th {
    @apply px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase;
  }
  tbody {
    @apply bg-white;
  }
  tr {
    @apply bg-white border-b;
  }
  td {
    @apply px-6 py-2 text-sm text-gray-500 whitespace-nowrap;
  }
</style>
