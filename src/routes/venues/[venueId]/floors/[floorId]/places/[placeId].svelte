<script context="module" lang="ts">
  import { emptyPlace } from './_empty-place';
  import type { Load } from '@sveltejs/kit';
  import type { Floor } from '$lib/types';
  import type { Polygon, Point } from 'geojson';

  export const load: Load = async ({ params, fetch }) => {
    const [venueResponse, floorResponse] = await Promise.all([
      fetch(`/api/venues/${params.venueId}`),
      fetch(`/api/venues/${params.venueId}/floors/${params.floorId}?withImage=true`),
    ]);
    const [venue, floor] = await Promise.all([venueResponse.json(), floorResponse.json() as Promise<Floor>]);

    if (!venue || !floor) {
      return { status: 404 };
    }

    if (params.placeId === 'new') {
      return { props: { venue, floor, place: emptyPlace } };
    }

    const placeResponse = await fetch(`/api/venues/${params.venueId}/floors/${params.floorId}/places/${params.placeId}`);
    const place: Venue = await placeResponse.json();

    if (!place) {
      return { status: 404 };
    }

    return { props: { venue, floor, place } };
  };
</script>

<script lang="ts">
  import { goto } from '$app/navigation';
  import bbox from '@turf/bbox';
  import type { LngLatBoundsLike, Map as MapboxMap } from 'mapbox-gl';
  import type { Place, Venue } from '$lib/types';
  import Map from '$lib/components/maps/Map.svelte';
  import MapboxDraw from '@mapbox/mapbox-gl-draw';
  // import { getMapbox } from '$lib/components/maps/mapbox';
  import FloorControl from '$lib/components/floors/FloorControl.svelte';

  export let venue: Venue;
  export let floor: Floor;
  export let place: Place;
  let map: MapboxMap;

  async function initMap(mapInstance: MapboxMap) {
    // const mapbox = await getMapbox();
    map = mapInstance;
    const boundingBox = bbox(venue.geometry) as LngLatBoundsLike;
    map.fitBounds(boundingBox, { animate: false, padding: { top: 50, bottom: 50, left: 50, right: 50 } });

    map.addSource(floor.id, { type: 'raster', url: `mapbox://${floor.tilesetId}` });
    map.addLayer({ id: floor.id, type: 'raster', source: floor.id, paint: { 'raster-fade-duration': 0 } });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        point: true,
        polygon: true,
        trash: true,
      },
    });

    map.addControl(draw, 'top-left');
    map.on('draw.create', updateArea);
    map.on('draw.delete', updateArea);
    map.on('draw.update', updateArea);

    if (place.geometry.coordinates.length) {
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

      place.geometry = data.features[0].geometry as Polygon | Point;

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
    }
  }

  async function submit() {
    if (place.id === 'new') {
      await fetch(`/api/venues/${venue.id}/floors/${floor.id}/places`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(place),
      });
    } else {
      await fetch(`/api/venues/${venue.id}/floors/${floor.id}/places/${place.id}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
        body: JSON.stringify(place),
      });
    }

    goto('/');
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.2.2/mapbox-gl-draw.css" type="text/css" />
</svelte:head>

<div class="flex flex-row flex-1">
  <div class="basis-1/3 flex flex-col min-w-0 px-8 py-6">
    <h2 class="mb-4">
      <span class="material-icons text-[32px] relative top-[5px] text-[#4264fb] mr-1">layers</span>Place
      <span class="mb-4 font-light text-gray-400">- #{place.id}</span>
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

      <button type="submit" class="btn btn-primary w-full mt-8">save</button>
    </form>
  </div>

  <div class="flex-1">
    <Map on:mapReady={e => initMap(e.detail)}>
      {#if map && venue}
        <FloorControl bind:selectedFloorId={floor.id} floors={[floor]} />
      {/if}
    </Map>
  </div>
</div>
