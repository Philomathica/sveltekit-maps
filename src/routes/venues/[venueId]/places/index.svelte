<script lang="ts">
  import type { LngLatBoundsLike, Map as MapboxMap } from 'mapbox-gl';
  import bbox from '@turf/bbox';

  import type { Floor as FloorLevel, Place, Venue } from '$lib/types';
  import Map from '$lib/components/maps/Map.svelte';
  import Places from '$lib/components/places/Places.svelte';
  import FloorControl from '$lib/components/floors/FloorControl.svelte';
  import { routes } from '$lib/enum-types';

  export let venue: Venue;
  export let floors: FloorLevel[];
  export let places: Place[];

  let mapInstance: MapboxMap;
  let selectedFloorId = '';
  let selectedPlaceId = '';

  $: {
    switchFloor(selectedFloorId);
    focusOnPlace(selectedPlaceId);
  }

  async function initMap(mapInst: MapboxMap) {
    mapInstance = mapInst;

    const boundingBox = bbox(venue.geometry) as LngLatBoundsLike;
    mapInstance.fitBounds(boundingBox, { padding: { top: 50, bottom: 50, left: 50, right: 50 }, animate: false });

    if (!floors.length) {
      alert('Make sure you created at least one floor');
      return;
    }

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

    // Intialize with first floor
    selectedFloorId = floors[0].id;

    return;
  }

  function switchFloor(floorId: string) {
    if (!floorId) {
      return;
    }

    floors.map(f => mapInstance.setLayoutProperty(f.id, 'visibility', 'none'));
    mapInstance.setLayoutProperty(floorId, 'visibility', 'visible');
  }

  function focusOnPlace(placeId: string) {
    if (!placeId) {
      return;
    }

    const place = places.find(pl => pl.id === placeId);
    if (!place) {
      return;
    }

    selectedFloorId = place?.floorId;

    mapInstance.flyTo({ center: [place?.marker[0], place?.marker[1]] });
  }
</script>

<div class="flex flex-row flex-1">
  <div class="flex flex-col w-96 px-8 py-6">
    <h2 class="flex items-center my-4">
      <span class="material-icons text-[32px] relative top-[0px] text-[#4264fb] mr-2">location_on</span>
      Places
    </h2>

    <div class="flex flex-col justify-between">
      <h3 class="mb-3">Places</h3>
      <Places {places} venueId={venue.id} on:placeSelect={e => (selectedPlaceId = e.detail)} />
      <a class="btn btn-primary inline-block mb-6 text-center" href="/{routes.VENUES}/{venue.id}/{routes.PLACES}/new">add Place</a>
    </div>
  </div>

  <div class="flex-1">
    <Map on:mapReady={e => initMap(e.detail)} />
    {#if mapInstance}
      <FloorControl bind:selectedFloorId {floors} on:floorChange={e => (selectedFloorId = e.detail)} />
    {/if}
  </div>
</div>
