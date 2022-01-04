<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = ({ page }) => {
    return { props: { id: page.params.id } };
  };
</script>

<script lang="ts">
  export let id: string;
</script>

Floor {id}
