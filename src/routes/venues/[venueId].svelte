<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ params }) => {
    return { props: { venueId: params.venueId } };
  };
</script>

<script lang="ts">
  export let venueId: string;
</script>

<div class="flex flex-col h-full">
  {#if venueId}
    <div class="px-8 py-6">{venueId}</div>
  {/if}
</div>
