<script lang="ts">
  /* eslint-disable @typescript-eslint/no-explicit-any */
  import { onDestroy, setContext, createEventDispatcher } from 'svelte';
  import { mapbox, key, MapboxContext } from './mapbox';

  import { GeoRefData, getPositionInfo } from '$lib/helpers/georeference';

  import { updateGeoRefDataByMarkers } from '$lib/helpers/mapbox';
  import { browser } from '$app/env';

  const dispatch = createEventDispatcher<{ mapReady: mapbox.Map }>();

  setContext<MapboxContext>(key, {
    getMap: () => map,
  });

  export let sourceCoordinates: number[][] = [];

  let map: mapbox.Map;
  let container: HTMLElement;
  let markerSW: mapbox.Marker;
  let markerNE: mapbox.Marker;

  export function setMarkerAndListeners(sourceId: string, georefData: GeoRefData) {
    markerSW = new mapbox.Marker({ draggable: true, anchor: 'bottom', offset: [0, 0] as mapbox.PointLike })
      .setLngLat(new mapbox.LngLat(georefData.points[0].longitude, georefData.points[0].latitude))
      .addTo(map);
    markerSW.on('drag', () => updateSourceCoordinates(markerSW, markerNE, sourceId, georefData));
    markerSW.on('dragend', () => updateSourceCoordinates(markerSW, markerNE, sourceId, georefData));

    markerNE = new mapbox.Marker({ draggable: true, anchor: 'bottom', offset: [0, 0] as mapbox.PointLike })
      .setLngLat(new mapbox.LngLat(georefData.points[1].longitude, georefData.points[1].latitude))
      .addTo(map);
    markerNE.on('drag', () => updateSourceCoordinates(markerSW, markerNE, sourceId, georefData));
    markerNE.on('dragend', () => updateSourceCoordinates(markerSW, markerNE, sourceId, georefData));

    // on init
    updateSourceCoordinates(markerSW, markerNE, sourceId, georefData);
  }

  export function updateSourceCoordinates(markerSW: mapbox.Marker, markerNE: mapbox.Marker, sourceId: string, georefData: GeoRefData) {
    sourceCoordinates = getPositionInfo(updateGeoRefDataByMarkers(markerSW, markerNE, georefData));
    (map.getSource(sourceId) as mapbox.ImageSource).setCoordinates(sourceCoordinates);
  }

  export function removeMarkers() {
    if (markerSW) markerSW.remove();
    if (markerNE) markerNE.remove();
  }

  export function removeSource(sourceId: string) {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }
  export function removeLayer(layerId: string) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  }

  export function getMapInstance() {
    return map;
  }

  function load() {
    map = new mapbox.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [0, 0],
      zoom: 3.5,
    });

    map.on('load', () => {
      dispatch('mapReady', map);
    });
  }

  onDestroy(() => {
    if (map) {
      map.remove();
    }
  });
</script>

<svelte:head>
  {#if browser}
    <link rel="stylesheet" href="https://unpkg.com/mapbox-gl/dist/mapbox-gl.css" on:load={load} />
  {/if}
</svelte:head>

<div class="w-full h-full" bind:this={container}>
  {#if map}
    <slot />
  {/if}
</div>
