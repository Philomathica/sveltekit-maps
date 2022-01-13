<script lang="ts">
  import type { Venue } from '$lib/types';
  import type { LngLatBounds } from 'mapbox-gl';
  import { getContext, onMount } from 'svelte';
  import { getMapbox, key } from './mapbox';

  const { getMap } = getContext(key);
  const map = getMap();

  let bounds: LngLatBounds;

  export let venues: Venue[];

  onMount(async () => {
    const mapbox = await getMapbox();
    bounds = new mapbox.LngLatBounds();
    if (venues.length > 1) {
      fitToBounds();
    }
  });

  function fitToBounds() {
    venues.map(v => bounds.extend(v.marker));
    map.fitBounds(bounds, { padding: { top: 150, bottom: 150, left: 150, right: 150 } });
  }
</script>

<button type="button" on:click={fitToBounds} class="right-[10px] top-[110px] absolute bg-white rounded-[3px] shadow-md p-[6px] leading-[0]">
  <span class="material-icons text-[18px]">zoom_out_map</span>
</button>
