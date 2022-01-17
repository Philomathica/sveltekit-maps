<script lang="ts">
  import type { FloorLevel } from '$lib/types';

  export let floors: FloorLevel[] = [];
  export let selectedFloor: FloorLevel | undefined;
</script>

{#if selectedFloor}
  <div class="right-10 bottom-10 absolute z-30 flex flex-col">
    {#each floors.sort((a, b) => b.number - a.number) as floor (floor.id)}
      <button
        type="button"
        class="w-10 h-10 mb-1 text-xs text-gray-500 bg-white rounded-full shadow-md"
        class:selected={selectedFloor.id === floor.id}
        on:click={() => (selectedFloor = floor)}
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
