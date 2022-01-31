<script lang="ts">
  import type { Floor } from '$lib/types';
  import { createEventDispatcher } from 'svelte';

  export let floors: Floor[] = [];
  export let selectedFloorId: string | undefined;

  const dispatch = createEventDispatcher();

  $: dispatch('floorChange', selectedFloorId);
</script>

{#if selectedFloorId}
  <div class="right-10 bottom-10 absolute z-30 flex flex-col-reverse">
    {#each floors as floor (floor.id)}
      <button
        type="button"
        class="w-10 h-10 mb-1 text-xs text-gray-500 bg-white rounded-full shadow-md"
        class:selected={selectedFloorId === floor.id}
        on:click={() => (selectedFloorId = floor.id)}
      >
        {floor.number}
      </button>
    {/each}
  </div>
{/if}

<style lang="postcss">
  .selected {
    @apply text-white bg-blue-600;
  }
</style>
