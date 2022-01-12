<script lang="ts">
  import { navigating } from '$app/stores';
  import Nav from '$lib/components/layout/Nav.svelte';
  import PreloadingIndicator from '$lib/components/ui/PreloadingIndicator.svelte';

  import '../app.css';
</script>

<div class="flex flex-col h-full">
  {#if $navigating}
    <PreloadingIndicator />
  {/if}

  <Nav />

  <main class="flex flex-col flex-1">
    <slot />
  </main>
</div>
