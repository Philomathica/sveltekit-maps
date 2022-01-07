<script lang="ts">
  import type { FloorLevel } from '$lib/types';
  import { createEventDispatcher, onMount } from 'svelte';

  export let floors: FloorLevel[];
  let activeFloorId: string;

  const dispatch = createEventDispatcher<{ selectFloor: string }>();

  onMount(async () => {
    if (floors?.length >= 1) {
      activeFloorId = floors[0].id;
      dispatch('selectFloor', floors[0].id);
    }
  });
</script>

<div class="floorControl">
  {#each floors as floor}
    <button
      type="button"
      class="floorControl-item"
      class:selected={activeFloorId === floor.id}
      on:click={() => {
        dispatch('selectFloor', floor.id);
        activeFloorId = floor.id;
      }}
    >
      {floor.id.slice(0, 3)}
    </button>
  {/each}
</div>

<style lang="postcss">
  .floorControl {
    @apply absolute right-10 bottom-10 z-30 flex flex-col;
  }
  .floorControl-item {
    @apply bg-white text-gray-500 p-2 mb-1 rounded-full text-xs;
  }
  .selected {
    @apply bg-blue-600 text-white;
  }
</style>
