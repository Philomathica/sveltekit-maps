<script lang="ts">
  import { getContext } from 'svelte';
  import { mapbox, key, MapboxContext } from '../scripts/mapbox';

  const { getMap } = getContext<MapboxContext>(key);
  const map = getMap();

  export let lat: number;
  export let lon: number;
  export let label: string;

  const popup = new mapbox.Popup({ offset: 25 }).setText(label);

  new mapbox.Marker().setLngLat([lon, lat]).setPopup(popup).addTo(map);
</script>
