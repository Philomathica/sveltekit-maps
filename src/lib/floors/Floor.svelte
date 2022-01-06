<script lang="ts">
  import type { FloorLevel } from '$lib/types';

  export let floors: FloorLevel[] = [];
</script>

<h2 class="text-3xl font-extrabold text-gray-900 tracking-tight mt-4">Floors</h2>
<table class="border-collapse table-fixed w-full text-sm mb-4 border-2">
  <tbody class="bg-white dark:bg-gray-800">
    {#each floors as floor (floor.id)}
      <tr>
        <td class="border-b border-gray-100 dark:border-gray-700 p-4 pl-8 text-gray-500 dark:text-gray-400">{floor.id}</td>
        <td class="border-b border-gray-100 dark:border-gray-700 p-4 pl-8 text-gray-500 dark:text-gray-400">{floor.number}</td>
        <td class="border-b border-gray-100 dark:border-gray-700 p-4 pl-8 text-gray-500 dark:text-gray-400">{floor.filename}</td>
        <td class="border-b border-gray-100 dark:border-gray-700 p-4 pl-8 text-gray-500 dark:text-gray-400">{floor.tileset}</td>
      </tr>
    {/each}
  </tbody>
</table>
<a class="px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm" href="/floors/new">add Floor</a>
