<script lang="ts">
  import { navigating } from '$app/stores';
  import PreloadingIndicator from '$lib/components/ui/PreloadingIndicator.svelte';

  import '../app.css';
</script>

<div class="flex h-full">
  {#if $navigating}
    <PreloadingIndicator />
  {/if}

  <main class="flex flex-1">
    <slot />
  </main>
</div>
