<script lang="ts">
  import type { ImageSource, PointLike } from 'mapbox-gl';

  import { onMount, setContext } from 'svelte';
  import { mapbox, key, MapboxContext } from './mapbox';
  import { projectPointForGeoreference, GeoRefData } from './georeference';

  setContext<MapboxContext>(key, {
    getMap: () => map,
  });

  export let zoom: number;

  export let upperLeftX: string;
  export let upperLeftY: string;
  export let lowerRightX: string;
  export let lowerRightY: string;

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
        center: [0, 0],
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

  export function dragImage(sourceId: string, layerId: string, georefData: GeoRefData) {
    const markerElBL = document.createElement('div');
    markerElBL.style.cssText = 'width: 10px; height: 10px; background: #f00';

    const markerBL = new mapbox.Marker({
      element: markerElBL,
      draggable: true,
      anchor: 'bottom',
      offset: [0, 0] as PointLike,
    })
      .setLngLat(new mapbox.LngLat(georefData.points[0].longitude, georefData.points[0].latitude))
      .addTo(map);

    const markerElTopR = document.createElement('div');
    markerElTopR.style.cssText = 'width: 10px; height: 10px; background: #00f';

    const markerTR = new mapbox.Marker({
      element: markerElTopR,
      draggable: true,
      anchor: 'bottom',
      offset: [0, 0] as PointLike,
    })
      .setLngLat(new mapbox.LngLat(georefData.points[1].longitude, georefData.points[1].latitude))
      .addTo(map);

    // const canvas = map.getCanvasContainer();

    markerBL.on('drag', () => {
      const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
      (map.getSource(sourceId) as ImageSource).setCoordinates(posInfo);
    });

    markerTR.on('drag', () => {
      const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
      (map.getSource(sourceId) as ImageSource).setCoordinates(posInfo);
    });

    markerBL.on('dragend', () => {
      const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
      upperLeftX = posInfo[0][0].toString();
      upperLeftY = posInfo[0][1].toString();
      lowerRightX = posInfo[2][0].toString();
      lowerRightY = posInfo[2][1].toString();
    });

    markerTR.on('dragend', () => {
      const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
      upperLeftX = posInfo[0][0].toString();
      upperLeftY = posInfo[0][1].toString();
      lowerRightX = posInfo[2][0].toString();
      lowerRightY = posInfo[2][1].toString();
    });
  }

  export function getPositionInfo(georefData: GeoRefData): number[][] {
    return [
      latLngToLngLat(projectPointForGeoreference([georefData.bbox[0], georefData.bbox[3]], georefData)),
      latLngToLngLat(projectPointForGeoreference([georefData.bbox[2], georefData.bbox[3]], georefData)),
      latLngToLngLat(projectPointForGeoreference([georefData.bbox[2], georefData.bbox[1]], georefData)),
      latLngToLngLat(projectPointForGeoreference([georefData.bbox[0], georefData.bbox[1]], georefData)),
    ];
  }

  export function getMarkersPosInfo(markerBL: mapbox.Marker, markerTR: mapbox.Marker, georefData: GeoRefData): number[][] {
    const { lng: lngBL, lat: latBL } = markerBL.getLngLat();
    const { lng: lngTR, lat: latTR } = markerTR.getLngLat();
    const newGeoRefData = {
      points: [
        {
          x: 0,
          y: 0,
          // SW
          longitude: lngBL,
          latitude: latBL,
        },
        {
          x: georefData.bbox[2], // width,
          y: georefData.bbox[3], // height,
          // NE
          longitude: lngTR,
          latitude: latTR,
        },
      ],
      bbox: georefData.bbox,
    };

    return getPositionInfo(newGeoRefData);
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
