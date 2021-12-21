<script lang="ts">
  import type { ImageSource, PointLike } from 'mapbox-gl';

  import { onMount, setContext, createEventDispatcher } from 'svelte';
  import { mapbox, key, MapboxContext } from './mapbox';
  import { projectPointForGeoreference } from './georeference';

  setContext<MapboxContext>(key, {
    getMap: () => map,
  });

  export let lat: number;
  export let lon: number;
  export let zoom: number;

  export let upperLeftX: string;
  export let upperLeftY: string;
  export let lowerRightX: string;
  export let lowerRightY: string;

  let container: HTMLElement;
  let map: mapbox.Map;
  const dispatch = createEventDispatcher();

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

  export function dragImage(sourceId: string, layerId: string, width: number, height: number) {
    const bbox = [0, 0, width, height];

    const markerElTopL = document.createElement('div');
    markerElTopL.style.cssText = 'width: 40px; height: 40px; background: #f00';

    const markerTopLeft = new mapbox.Marker({
      element: markerElTopL,
      draggable: true,
      anchor: 'bottom',
      offset: [-20, 0] as PointLike,
    })
      .setLngLat(new mapbox.LngLat(-80.425, 46.437))
      .addTo(map);

    const markerElBottomR = document.createElement('div');
    markerElBottomR.style.cssText = 'width: 40px; height: 40px; background: #00f';

    const markerBottomRight = new mapbox.Marker({
      element: markerElBottomR,
      draggable: true,
      anchor: 'bottom',
      offset: [20, 40] as PointLike,
    })
      .setLngLat(new mapbox.LngLat(-71.516, 37.936))
      .addTo(map);

    const canvas = map.getCanvasContainer();

    markerTopLeft.on('drag', () => {
      const { lng: lngTl, lat: latTl } = markerTopLeft.getLngLat();
      const { lng: lngBr, lat: latBr } = markerBottomRight.getLngLat();
      const geoRefData = [
        {
          x: 0,
          y: 0,
          latitude: latTl,
          longitude: lngTl,
        },
        {
          x: width,
          y: height,
          latitude: latBr,
          longitude: lngBr,
        },
      ];

      const posInfo = getPositionInfo(bbox, geoRefData);
      (map.getSource(sourceId) as ImageSource).setCoordinates(posInfo);
    });

    markerTopLeft.on('dragend', () => {
      const { lng, lat } = markerTopLeft.getLngLat();
      upperLeftX = lng.toString();
      upperLeftY = lat.toString();
    });

    markerBottomRight.on('dragend', () => {
      const { lng, lat } = markerBottomRight.getLngLat();
      lowerRightX = lng.toString();
      lowerRightY = lat.toString();
    });

    markerBottomRight.on('drag', () => {
      const { lng: lngTl, lat: latTl } = markerTopLeft.getLngLat();
      const { lng: lngBr, lat: latBr } = markerBottomRight.getLngLat();
      const geoRefData = [
        {
          x: 0,
          y: 0,
          latitude: latTl,
          longitude: lngTl,
        },
        {
          x: width,
          y: height,
          latitude: latBr,
          longitude: lngBr,
        },
      ];

      const posInfo = getPositionInfo(bbox, geoRefData);
      (map.getSource(sourceId) as ImageSource).setCoordinates(posInfo);
    });
  }

  export function getPositionInfo(bbox: number[], georefData: K.GeoRefData) {
    return [
      latLngToLngLat(projectPointForGeoreference([bbox[0], bbox[3]], { points: georefData })),
      latLngToLngLat(projectPointForGeoreference([bbox[2], bbox[3]], { points: georefData })),
      latLngToLngLat(projectPointForGeoreference([bbox[2], bbox[1]], { points: georefData })),
      latLngToLngLat(projectPointForGeoreference([bbox[0], bbox[1]], { points: georefData })),
    ];
  }

  export function latLngToLngLat(t): any {
    return [t[1], t[0]];
  }
</script>

<div class="w-full h-full" bind:this={container}>
  {#if map}
    <slot />
  {/if}
</div>
