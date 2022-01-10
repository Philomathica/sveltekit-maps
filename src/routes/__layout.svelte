<script lang="ts">
  import Nav from '$lib/layout/Nav.svelte';

  import '../app.css';
</script>

<div class="flex flex-col h-full">
  <div>
    <Nav />
  </div>

  <main class="flex flex-col flex-1">
    <slot />
  </main>
</div>
