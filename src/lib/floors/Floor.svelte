<script lang="ts">
  import type { FloorLevel } from '$lib/types';

  export let floors: FloorLevel[] = [];
</script>

<h2 class="text-3xl font-extrabold text-gray-900 tracking-tight mt-4">Floors</h2>
<table class="table-fixed">
  <tbody>
    {#each floors as floor (floor.id)}
      <tr>
        <td>{floor.number}</td>
      </tr>
    {/each}
  </tbody>
</table>
<a class="px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm" href="/floors/new">add Floor</a>
