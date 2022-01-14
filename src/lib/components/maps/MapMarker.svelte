<script lang="ts">
  import type { Map } from 'mapbox-gl';
  import { createEventDispatcher, getContext, onDestroy, onMount } from 'svelte';
  import { key, getMapbox } from './mapbox';

  const { getMap } = getContext(key);
  const map: Map = getMap();

  export let lat: number;
  export let lon: number;

  let markerEl: HTMLElement;

  const dispatch = createEventDispatcher<{ markerSelect: undefined }>();

  onMount(async () => {
    const mapbox = await getMapbox();

    const mapMarker = new mapbox.Marker().setLngLat([lon, lat]).addTo(map);
    mapMarker.setLngLat([lon, lat]);

    markerEl = mapMarker.getElement();

    markerEl.addEventListener('click', () => {
      dispatch('markerSelect', undefined);
    });
  });

  onDestroy(() => {
    markerEl.remove();
  });
</script>
