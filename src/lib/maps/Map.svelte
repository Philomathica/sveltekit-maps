<script lang="ts">
  import type { ImageSource } from 'mapbox-gl';

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

  export function goToLocation(lngLat: mapbox.LngLatLike, addMarker = false, zoom = 20) {
    const popup = new mapbox.Popup({ offset: 25 }).setText('hi');
    if (addMarker) {
      new mapbox.Marker().setLngLat(lngLat).setPopup(popup).addTo(map);
    }
    map.flyTo({ center: lngLat, zoom });
  }

  export function addLayer(sourceId: string, source: mapbox.AnySourceData, layer: mapbox.AnyLayer) {
    map.addSource(sourceId, source);
    map.addLayer(layer);
  }

  export function dragImage(sourceId: string, layerId: string) {
    const canvas = map.getCanvasContainer();

    function onMove(event: mapbox.MapMouseEvent & mapbox.EventData) {
      const coords = event.lngLat;
      canvas.style.cursor = 'grabbing';
      console.log(coords);
      (map.getSource(sourceId) as ImageSource).setCoordinates([[coords.lng, coords.lat]]);
    }

    function onUp() {
      canvas.style.cursor = '';

      map.off('mousemove', onMove);
      map.off('touchmove', onMove);
    }

    map.on('mouseenter', layerId, () => {
      alert('hi');
      canvas.style.cursor = 'move';
    });

    map.on('mouseleave', layerId, () => {
      canvas.style.cursor = '';
    });

    map.on('mousedown', layerId, e => {
      e.preventDefault();

      canvas.style.cursor = 'grab';

      map.on('mousemove', onMove);
      map.once('mouseup', onUp);
    });
  }
</script>

<div class="w-full h-full" bind:this={container}>
  {#if map}
    <slot />
  {/if}
</div>
