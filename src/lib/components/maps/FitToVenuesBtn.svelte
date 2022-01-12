<script lang="ts">
  import { getContext } from 'svelte';
  import type { Venue } from '$lib/types';
  import { key } from './mapbox';
  import { LngLatBounds } from 'mapbox-gl';

  const { getMap } = getContext(key);
  const map = getMap();
  const bounds = new LngLatBounds();

  export let venues: Venue[];
  function fitToBounds() {
    venues.map(v => bounds.extend(v.marker));
    map.fitBounds(bounds, { padding: { top: 50, bottom: 50, left: 50, right: 50 } });
  }
</script>

<button type="button" on:click={fitToBounds} class="right-[10px] top-[110px] absolute bg-white rounded-[3px] shadow-md p-[6px] leading-[0]">
  <span class="material-icons text-[18px]">zoom_out_map</span>
</button>
