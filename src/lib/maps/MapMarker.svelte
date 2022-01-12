<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import { mapbox, key } from './mapbox';

  const { getMap } = getContext(key);
  const map = getMap();

  export let lat: number;
  export let lon: number;

  const dispatch = createEventDispatcher<{ click: undefined }>();

  const mapMarker = new mapbox.Marker().setLngLat([lon, lat]).addTo(map);
  const markerEl = mapMarker.getElement();
  markerEl.addEventListener('click', () => {
    dispatch('click', undefined);
  });
</script>
