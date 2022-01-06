<script lang="ts">
  /* eslint-disable @typescript-eslint/no-explicit-any */
  import { onDestroy, onMount, setContext, createEventDispatcher } from 'svelte';
  import { mapbox, key, MapboxContext } from './mapbox';

  import type { GeoRefData } from '$lib/helpers/georeference';

  import { getMarkersPosInfo } from '$lib/helpers/mapbox';

  const dispatch = createEventDispatcher<{ mapReady: mapbox.Map }>();

  setContext<MapboxContext>(key, {
    getMap: () => map,
  });

  export let gcps: string[] = [];

  let map: mapbox.Map;
  let container: HTMLElement;

  export function dragImage(sourceId: string, georefData: GeoRefData) {
    const markerBL = new mapbox.Marker({ draggable: true, anchor: 'bottom', offset: [0, 0] as mapbox.PointLike })
      .setLngLat(new mapbox.LngLat(georefData.points[0].longitude, georefData.points[0].latitude))
      .addTo(map);

    const markerTR = new mapbox.Marker({ draggable: true, anchor: 'bottom', offset: [0, 0] as mapbox.PointLike })
      .setLngLat(new mapbox.LngLat(georefData.points[1].longitude, georefData.points[1].latitude))
      .addTo(map);

    const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
    (map.getSource(sourceId) as mapbox.ImageSource).setCoordinates(posInfo);
    updateGCPs(posInfo, georefData);

    markerBL.on('drag', () => {
      const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
      (map.getSource(sourceId) as mapbox.ImageSource).setCoordinates(posInfo);
    });

    markerTR.on('drag', () => {
      const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
      (map.getSource(sourceId) as mapbox.ImageSource).setCoordinates(posInfo);
    });

    markerBL.on('dragend', () => {
      const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
      updateGCPs(posInfo, georefData);
    });

    markerTR.on('dragend', () => {
      const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
      updateGCPs(posInfo, georefData);
    });
  }

  export function getMapInstance() {
    return map;
  }

  onMount(() => {
    map = new mapbox.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [0, 0],
      zoom: 3.5,
    });

    map.on('load', () => {
      dispatch('mapReady', map);
    });
  });

  onDestroy(() => {
    if (map) {
      map.remove();
    }
  });

  function updateGCPs(posInfo: any, georefData: GeoRefData) {
    if (!posInfo) {
      return;
    }

    const upperLX = posInfo[0][0].toString();
    const upperLY = posInfo[0][1].toString();
    const upperRX = posInfo[1][0].toString();
    const upperRY = posInfo[1][1].toString();
    const lowerRX = posInfo[2][0].toString();
    const lowerRY = posInfo[2][1].toString();
    const lowerLX = posInfo[3][0].toString();
    const lowerLY = posInfo[3][1].toString();

    // const cornerPoints: mapbox.LngLatLike[] = [
    //   [+upperLX, +upperLY], // 1
    //   [+upperRX, +upperRY], // 2
    //   [+lowerRX, +lowerRY], // 3
    //   [+lowerLX, +lowerLY], // 4
    // ];

    gcps = [
      '-gcp',
      '0',
      '0',
      upperLX,
      upperLY,
      '-gcp',
      georefData.bbox[2].toString(),
      '0',
      upperRX,
      upperRY,
      '-gcp',
      georefData.bbox[2].toString(),
      georefData.bbox[3].toString(),
      lowerRX,
      lowerRY,
      '-gcp',
      '0',
      georefData.bbox[3].toString(),
      lowerLX,
      lowerLY,
    ];
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="https://unpkg.com/mapbox-gl/dist/mapbox-gl.css" />
</svelte:head>

<div class="w-full h-full" bind:this={container}>
  {#if map}
    <slot />
  {/if}
</div>
