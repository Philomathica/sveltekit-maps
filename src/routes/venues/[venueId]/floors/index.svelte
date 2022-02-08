<script lang="ts">
  import type { LngLatBoundsLike, Map as MapboxMap } from 'mapbox-gl';
  import bbox from '@turf/bbox';

  import type { Floor as FloorLevel, Venue } from '$lib/types';
  import Floors from '$lib/components/floors/Floors.svelte';
  import Map from '$lib/components/maps/Map.svelte';
  import FloorControl from '$lib/components/floors/FloorControl.svelte';
  import { routes } from '$lib/enum-types';

  export let floors: FloorLevel[];
  export let venue: Venue;

  let mapInstance: MapboxMap;
  let selectedFloorId = '';

  $: switchFloor(selectedFloorId);

  async function initMap(mapInst: MapboxMap) {
    mapInstance = mapInst;

    const boundingBox = bbox(venue.geometry) as LngLatBoundsLike;
    mapInstance.fitBounds(boundingBox, { padding: { top: 50, bottom: 50, left: 50, right: 50 }, animate: false });

    const minZoomLevel = 17;
    floors.map(floor => {
      // below uses only the previewImage
      // mapInstance.addSource(floor.id, { type: 'image', url: floor.previewImage, coordinates: getPositionInfo(floor.georeference) });
      mapInstance.addSource(floor.id, { type: 'raster', url: `mapbox://${floor.tilesetId}` });
      mapInstance.addLayer({
        id: floor.id,
        type: 'raster',
        source: floor.id,
        paint: { 'raster-fade-duration': 0 },
        minzoom: minZoomLevel,
      });
    });

    // TODO define default floor-logic
    if (floors.length) {
      selectedFloorId = floors[0].id;
    }

    return;
  }

  function switchFloor(floorId: string) {
    if (!floorId) {
      return;
    }

    floors.map(f => mapInstance.setLayoutProperty(f.id, 'visibility', 'none'));
    mapInstance.setLayoutProperty(floorId, 'visibility', 'visible');
  }
</script>

<div class="flex flex-row flex-1">
  <div class="flex flex-col w-96 px-8 py-6">
    <h2 class="flex items-center my-4">
      <span class="material-icons text-[32px] top-[2px] relative text-[#4264fb] mr-2">layers</span>
      Floors
    </h2>
    <div class="flex flex-col justify-between">
      <h3 class="mb-3">Floors</h3>
      {#if floors}
        <Floors bind:selectedFloorId {floors} on:floorChange={e => (selectedFloorId = e.detail)} />
      {/if}
      <a class="btn btn-primary inline-block mb-6 text-center" href="/{routes.VENUES}/{venue.id}/{routes.FLOORS}/new">add Floor</a>
    </div>
  </div>

  <div class="flex-1">
    <Map on:mapReady={e => initMap(e.detail)} />
    {#if mapInstance}
      <FloorControl bind:selectedFloorId {floors} on:floorChange={e => (selectedFloorId = e.detail)} />
    {/if}
  </div>
</div>
