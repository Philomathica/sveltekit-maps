<script lang="ts">
  import type { FloorLevel } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher<{ floorSelect: FloorLevel; delete: FloorLevel }>();

  export let floors: FloorLevel[] = [];
  export let venueId: string;
  export let selectedFloor: FloorLevel | undefined;
</script>

{#if selectedFloor}
  <div class="overflow-x-auto">
    <table class="w-full mb-4 text-sm border-2 border-collapse table-fixed">
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
          <tr
            in:fade|local
            on:click={() => (selectedFloor = floor)}
            class:active={selectedFloor.id === floor.id}
            class="hover:bg-blue-100 hover:cursor-pointer"
          >
            <td>{floor.id}</td>
            <td>{floor.number}</td>
            <td>{floor.filename.split('.')[0]}</td>
            <td>{floor.tileset.split('.')[1]}</td>
            <td class="text-right">
              <a class="btn btn-secondary text-blue-600" href="/venues/{venueId}/floors/{floor.id}">Edit</a>
              <button type="button" class="btn btn-secondary ml-2 text-red-600" on:click|stopPropagation={() => dispatch('delete', floor)}
                >Delete
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<a class="btn btn-primary inline-block mb-6" href="/venues/{venueId}/floors/new">add Floor</a>

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
