<script lang="ts">
  import { fly, fade } from 'svelte/transition';

  import Portal from './Portal.svelte';
  export let isModalOpen = false;
  export let closeModalOutside = false;

  function closeModalOnButtonClick() {
    isModalOpen = false;
  }

  function closeModalOnBackgroundClick() {
    if (!closeModalOutside) {
      return;
    }
    isModalOpen = false;
  }
</script>

{#if isModalOpen}
  <Portal>
    <div class="fixed z-50 w-full mx-auto my-0 inset-x-[0] inset-y-[100px] max-w-[530px] min-w-[320px]" transition:fly={{ opacity: 0, y: 100 }}>
      <button class="-top-1 -right-2 absolute w-8 h-8 bg-white border border-gray-300 rounded-full shadow-xl" on:click={closeModalOnButtonClick}>
        &#10006;
      </button>
      <div class="p-5 bg-white shadow-2xl">
        <slot />
      </div>
    </div>
    <div on:click={closeModalOnBackgroundClick} transition:fade class="opacity-60 fixed inset-0 z-40 bg-black cursor-pointer" />
  </Portal>
{/if}
