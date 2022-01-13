<script lang="ts">
  /* eslint-disable @typescript-eslint/no-explicit-any */
  import type mapboxgl from 'mapbox-gl';
  import type { ImageSource, Map, Marker, PointLike } from 'mapbox-gl';
  import { onDestroy, setContext, createEventDispatcher } from 'svelte';
  import { getMapbox, key, MapboxContext } from './mapbox';

  import { GeoRefData, getPositionInfo } from '$lib/helpers/georeference';

  import { updateGeoRefDataByMarkers } from '$lib/helpers/mapbox';
  import { browser } from '$app/env';

  const dispatch = createEventDispatcher<{ mapReady: Map }>();

  setContext<MapboxContext>(key, {
    getMap: () => mapInstance,
  });

  export let sourceCoordinates: number[][] = [];

  let mapbox: typeof mapboxgl;
  let mapInstance: Map;
  let container: HTMLElement;
  let markerSW: Marker;
  let markerNE: Marker;

  export function setMarkerAndListeners(sourceId: string, georefData: GeoRefData) {
    markerSW = new mapbox.Marker({ draggable: true, anchor: 'bottom', offset: [0, 0] as PointLike })
      .setLngLat(new mapbox.LngLat(georefData.points[0].longitude, georefData.points[0].latitude))
      .addTo(mapInstance);
    markerSW.on('drag', () => updateSourceCoordinates(markerSW, markerNE, sourceId, georefData));
    markerSW.on('dragend', () => updateSourceCoordinates(markerSW, markerNE, sourceId, georefData));

    markerNE = new mapbox.Marker({ draggable: true, anchor: 'bottom', offset: [0, 0] as PointLike })
      .setLngLat(new mapbox.LngLat(georefData.points[1].longitude, georefData.points[1].latitude))
      .addTo(mapInstance);
    markerNE.on('drag', () => updateSourceCoordinates(markerSW, markerNE, sourceId, georefData));
    markerNE.on('dragend', () => updateSourceCoordinates(markerSW, markerNE, sourceId, georefData));

    // on init
    updateSourceCoordinates(markerSW, markerNE, sourceId, georefData);
  }

  export function updateSourceCoordinates(markerSW: Marker, markerNE: Marker, sourceId: string, georefData: GeoRefData) {
    sourceCoordinates = getPositionInfo(updateGeoRefDataByMarkers(markerSW, markerNE, georefData));
    (mapInstance.getSource(sourceId) as ImageSource).setCoordinates(sourceCoordinates);
  }

  export function removeMarkers() {
    if (markerSW) markerSW.remove();
    if (markerNE) markerNE.remove();
  }

  export function removeSource(sourceId: string) {
    if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
  }

  export function removeLayer(layerId: string) {
    if (mapInstance.getLayer(layerId)) mapInstance.removeLayer(layerId);
  }

  export function getMapInstance() {
    return mapInstance;
  }

  async function load() {
    mapbox = await getMapbox();
    mapInstance = new mapbox.Map({
      container,
      accessToken: mapbox.accessToken,
      style: 'mapbox://styles/mapbox/streets-v9',
    });

    mapInstance.on('load', () => {
      dispatch('mapReady', mapInstance);
      mapInstance.addControl(new mapbox.NavigationControl());
    });
  }

  onDestroy(() => {
    if (mapInstance) {
      mapInstance.remove();
    }
  });
</script>

<svelte:head>
  {#if browser}
    <link rel="stylesheet" href="https://unpkg.com/mapbox-gl/dist/mapbox-gl.css" on:load={load} />
  {/if}
</svelte:head>

<div class="w-full h-full" bind:this={container}>
  {#if mapInstance}
    <slot />
  {/if}
</div>
