<script lang="ts">
  import type { FloorLevel } from '$lib/types';
  import { createEventDispatcher, onMount } from 'svelte';

  export let floors: FloorLevel[] = [];

  let activeFloorId: string;

  const dispatch = createEventDispatcher<{ floorSelect: string }>();

  onMount(() => {
    if (floors.length) {
      activeFloorId = floors[0].id;
      dispatch('floorSelect', floors[0].id);
    }
  });

  function selectFloor(id: string) {
    activeFloorId = id;
    dispatch('floorSelect', id);
  }
</script>

<div class="right-10 bottom-10 absolute z-30 flex flex-col">
  {#each floors as floor (floor.id)}
    <button
      type="button"
      class="p-2 mb-1 text-xs text-gray-500 bg-white rounded-full"
      class:selected={activeFloorId === floor.id}
      on:click={() => selectFloor(floor.id)}
    >
      {floor.id.slice(0, 3)}
    </button>
  {/each}
</div>

<style lang="postcss">
  .selected {
    @apply bg-blue-600 text-white;
  }
</style>
