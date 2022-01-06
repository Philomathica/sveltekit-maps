<script lang="ts">
  import type { FloorLevel } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher<{ delete: FloorLevel }>();

  export let floors: FloorLevel[] = [];
</script>

<h2 class="mb-4">Floors</h2>

<table>
  <tbody>
    {#each floors as floor (floor.id)}
      <tr transition:fade|local>
        <td>{floor.id}</td>
        <td>{floor.number}</td>
        <td>{floor.filename}</td>
        <td>{floor.tileset}</td>
        <td><a class="btn btn-primary" href="/floors/{floor.id}">Edit</a></td>
        <td><button class="btn btn-primary" on:click={() => dispatch('delete', floor)}>Delete</button></td>
      </tr>
    {/each}
  </tbody>
</table>
<a class="inline-block mb-6 btn btn-primary" href="/floors/new">add Floor</a>

<style lang="postcss">
  table {
    @apply w-full mb-4 text-sm border-2 border-collapse table-fixed;
  }
  tbody {
    @apply bg-white dark:bg-gray-800;
  }
  td {
    @apply p-1 pl-4 text-gray-500 border-b border-gray-100 dark:border-gray-700 dark:text-gray-400;
  }
</style>
