<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import { mapbox, key, MapboxContext } from './mapbox';

  setContext<MapboxContext>(key, {
    getMap: () => map,
  });

  export let lat: number;
  export let lon: number;
  export let zoom: number;

  let container: HTMLElement;
  let map: mapbox.Map;

  onMount(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/mapbox-gl/dist/mapbox-gl.css';

    link.onload = () => {
      map = new mapbox.Map({
        container,
        style: 'mapbox://styles/mapbox/streets-v9',
        center: [lon, lat],
        zoom,
      });
    };

    document.head.appendChild(link);

    return () => {
      map.remove();
      link.parentNode.removeChild(link);
    };
  });

  export function goToLocation(lngLat: mapbox.LngLatLike, addMarker = false, zoom = 20): void {
    const popup = new mapbox.Popup({ offset: 25 }).setText('hi');
    if (addMarker) {
      new mapbox.Marker().setLngLat(lngLat).setPopup(popup).addTo(map);
    }
    map.flyTo({ center: lngLat, zoom });
  }

  export function addLayer(sourceId: string, source: mapbox.AnySourceData, layer: mapbox.AnyLayer): void {
    map.addSource(sourceId, source);
    map.addLayer(layer);
  }
</script>

<div class="w-full h-full" bind:this={container}>
  {#if map}
    <slot />
  {/if}
</div>
