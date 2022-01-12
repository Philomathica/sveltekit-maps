<script>
  import { onMount } from 'svelte';
  let p = 0;
  let visible = false;
  onMount(() => {
    visible = true;
    function next() {
      p += 0.1;
      const remaining = 1 - p;
      if (remaining > 0.15) setTimeout(next, 500 / remaining);
    }
    setTimeout(next, 250);
  });
</script>

{#if visible}
  <div class="absolute top-0 left-0 w-full h-1 z-50">
    <div class="progress absolute top-0 left-0 h-full bg-blue-500" style="width: {p * 100}%" />
  </div>
{/if}

{#if p >= 0.4}
  <div class="fade fixed w-full h-full bg-white z-40" />
{/if}

<style>
  .progress {
    transition: width 0.4s;
  }

  .fade {
    --tw-bg-opacity: 0.3;
    animation: fade 0.4s;
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
