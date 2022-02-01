<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';
  import type { Floor } from '$lib/types';
  import type { Polygon, Point } from 'geojson';

  export const load: Load = async ({ params, fetch }) => {
    const [venueResponse, floorResponse] = await Promise.all([
      fetch(`/api/venues/${params.venueId}`),
      fetch(`/api/venues/${params.venueId}/floors?withImage=true`),
    ]);
    const [venue, floors] = await Promise.all([venueResponse.json(), floorResponse.json() as Promise<Floor[]>]);

    if (!venue || !floors) {
      return { status: 404 };
    }

    if (params.placeId === 'new') {
      return { props: { venue, floors, place: { ...emptyPlace } } };
    }

    const placeResponse = await fetch(`/api/venues/${params.venueId}/places/${params.placeId}`);
    const place: Venue = await placeResponse.json();

    if (!place) {
      return { status: 404 };
    }

    return { props: { venue, floors, place } };
  };
</script>

<script lang="ts">
  import { goto } from '$app/navigation';
  import type { LngLatBoundsLike, Map as MapboxMap } from 'mapbox-gl';
  import MapboxDraw from '@mapbox/mapbox-gl-draw';
  import bbox from '@turf/bbox';
  import type { Place, Venue } from '$lib/types';
  import { isPolygon, isPoint } from 'geojson-validation';
  // import { getMapbox } from '$lib/components/maps/mapbox';
  import { emptyPlace } from './_empty-place';
  import { routes } from '$lib/enum-types';
  import Map from '$lib/components/maps/Map.svelte';
  import FloorControl from '$lib/components/floors/FloorControl.svelte';

  export let venue: Venue;
  export let floors: Floor[];
  export let place: Place;

  let mapInstance: MapboxMap;
  let selectedFloorId = '';

  $: switchFloor(selectedFloorId);

  async function initMap(mapInst: MapboxMap) {
    // const mapbox = await getMapbox();
    mapInstance = mapInst;

    // FitBounds
    const boundingBox = bbox(venue.geometry) as LngLatBoundsLike;
    mapInstance.fitBounds(boundingBox, { animate: false, padding: { top: 50, bottom: 50, left: 50, right: 50 } });

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

    const floorForPlace = floors.find(f => f.id === place.floorId);
    selectedFloorId = floorForPlace ? floorForPlace.id : floors[0].id;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        point: true,
        polygon: true,
        trash: true,
      },
    });

    mapInstance.addControl(draw, 'top-left');

    mapInstance.on('draw.create', updateArea);
    mapInstance.on('draw.delete', updateArea);
    mapInstance.on('draw.update', updateArea);
    console.log('floors', floors);
    if (isPolygon(place.geometry) || isPoint(place.geometry)) {
      draw.set({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: place.geometry as Polygon | Point,
          },
        ],
      });
    }

    function updateArea(e: MapboxDraw.DrawEvent) {
      console.log('e.type', e.type);
      const data = draw.getAll();

      if (draw.getMode() === 'draw_polygon' || draw.getMode() === 'draw_point') {
        const pids: any = [];
        const lid = data.features[data.features.length - 1].id;
        data.features.forEach(f => {
          if (f.geometry.type === 'Polygon' && f.id !== lid) {
            pids.push(f.id);
          }
          if (f.geometry.type === 'Point' && f.id !== lid) {
            pids.push(f.id);
          }
        });
        draw.delete(pids);
      }

      place = { ...place, geometry: data.features[data.features.length - 1].geometry as Polygon | Point };
    }
  }

  async function submit() {
    // update corresponding floor on place
    place = { ...place, floorId: selectedFloorId, venueId: venue.id };

    if (place.id === 'new') {
      await fetch(`/api/${routes.VENUES}/${venue.id}/${routes.PLACES}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(place),
      });
    } else {
      await fetch(`/api/${routes.VENUES}/${venue.id}/${routes.PLACES}/${place.id}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
        body: JSON.stringify(place),
      });
    }

    goto(`/${routes.VENUES}/${venue.id}/${routes.PLACES}`);
  }

  async function deletePlace(place: Place) {
    const confirm = window.confirm(`Are you sure you want to delete place ${place.name}?`);

    if (!confirm) {
      return;
    }

    const response = await fetch(`/api/${routes.PLACES}/${venue.id}/places/${place.id}`, { method: 'DELETE' });
    if (!response.ok) {
      return window.alert(`Error deleting place: ${await response.text()}`);
    }

    goto(`/venues/${venue.id}/places`);
  }

  function switchFloor(floorId: string) {
    if (!floorId) {
      return;
    }

    floors.map(f => mapInstance.setLayoutProperty(f.id, 'visibility', 'none'));
    mapInstance.setLayoutProperty(floorId, 'visibility', 'visible');
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.2.2/mapbox-gl-draw.css" type="text/css" />
</svelte:head>

<div class="flex flex-row flex-1">
  <div class="flex flex-col w-96 px-8 py-6">
    <h2 class="flex items-center my-4">
      <span class="material-icons text-[32px] relative top-[5px] text-[#4264fb] mr-2">layers</span>Place: #{place.id}
      <span class="material-icons text-[16px] relative top-[5px] text-gray-300 ml-auto" on:click={() => deletePlace(place)}>delete</span>
    </h2>

    <form on:submit|preventDefault={submit}>
      <label class="block mb-4 text-xs font-light text-gray-400 uppercase">
        Name
        <input type="text" bind:value={place.name} class="w-full" required />
      </label>

      <div class="p-4 mb-4 text-xs font-light text-gray-500 bg-gray-200 border">
        <pre>
          {JSON.stringify(place.geometry, null, 2)}
        </pre>
      </div>

      <div class="flex">
        <button
          type="button"
          class="basis-1/3 btn btn-primary-outline w-full mt-8 text-gray-400 mr-4"
          on:click={() => goto(`/${routes.VENUES}/${venue.id}/${routes.PLACES}`)}>Cancel</button
        >
        <button type="submit" class="btn btn-primary w-full mt-8">save</button>
      </div>
    </form>
  </div>

  <div class="flex-1">
    <Map on:mapReady={e => initMap(e.detail)}>
      {#if mapInstance}
        <FloorControl bind:selectedFloorId {floors} on:floorChange={e => (selectedFloorId = e.detail)} />
      {/if}
    </Map>
  </div>
</div>
