<script lang="ts">
  import type { FloorLevel, MapboxJobStatus } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher<{ floorSelect: FloorLevel; delete: FloorLevel; jobResultRequested: string }>();

  export let floors: FloorLevel[] = [];
  export let venueId: string;
  export let selectedFloor: FloorLevel | undefined;

  $: floors.sort((a, b) => a.number - b.number);

  let jobResults: Record<string, string> = {};

  async function getJobStatus(jobId: string) {
    jobResults[jobId] = 'Loading job status';
    const response = await fetch(`/api/tilesets/jobs/${jobId}`);
    const result: MapboxJobStatus = await response.json();
    jobResults[jobId] = result.error ? `error: ${result.error}` : result.progress === 0 ? 'Job in progress' : 'Job finished';
  }

  function updateSelectedFloorOnRowClick(event: MouseEvent & { currentTarget: EventTarget & HTMLTableRowElement }, floor: FloorLevel) {
    if (event.target === event.currentTarget || [...event.currentTarget.children].some(c => c === event.target)) {
      selectedFloor = floor;
    }
  }
</script>

{#if selectedFloor}
  <div class="overflow-x-auto">
    <table class="w-full mb-4 text-sm border border-collapse table-auto">
      <thead class="bg-gray-50">
        <tr>
          <th>Floor</th>
          <th>Job result</th>
          <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody class="bg-white">
        {#each floors as floor (floor.id)}
          <tr
            in:fade|local
            on:click={e => updateSelectedFloorOnRowClick(e, floor)}
            class:active={selectedFloor.id === floor.id}
            class="hover:bg-blue-100 hover:cursor-pointer"
          >
            <td>{floor.number}</td>
            <td>
              {#if jobResults[floor.jobId]}
                {jobResults[floor.jobId]}
              {:else}
                Request job status
              {/if}
            </td>
            <td class="text-right">
              <button type="button" class="btn btn-secondary" on:click={() => getJobStatus(floor.jobId)}>&#8635;</button>
              <a class="btn btn-secondary ml-2 text-blue-600" href="/venues/{venueId}/floors/{floor.id}" sveltekit:prefetch>Edit</a>
              <button type="button" class="btn btn-secondary ml-2 text-red-600" on:click={() => dispatch('delete', floor)}>Delete</button>
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
    @apply bg-blue-400;
  }
  .active td {
    @apply text-white;
  }
</style>
