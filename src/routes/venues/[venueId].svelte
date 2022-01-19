<script context="module" lang="ts">
  import type { Venue } from '$lib/types';
  import type { Load } from '@sveltejs/kit';
  import type { Polygon } from 'geojson';
  import { goto } from '$app/navigation';
  import { emptyVenue } from './_empty-venue';

  export const load: Load = async ({ params, fetch }) => {
    const venueId = params.venueId;

    if (params.venueId === 'new') {
      return { props: { venue: emptyVenue } };
    }

    const response = await fetch(`/api/venues/${venueId}`);
    const venue: Venue = await response.json();

    if (!venue) {
      return {
        status: 404,
      };
    }

    return { props: { venue } };
  };
</script>

<script lang="ts">
  import type { Map as MapboxMap, LngLatBoundsLike, Marker } from 'mapbox-gl';
  import MapboxDraw from '@mapbox/mapbox-gl-draw';
  import Map from '$lib/components/maps/Map.svelte';
  import center from '@turf/center';
  import bbox from '@turf/bbox';

  import type { AllGeoJSON } from '@turf/helpers';
  import { getMapbox } from '$lib/components/maps/mapbox';

  export let venue: Venue;

  let devMode: boolean;
  let map: MapboxMap;
  let isSubmitting = false;
  let markerEl: Marker;
  let boundingBox: LngLatBoundsLike;

  async function createVenue() {
    isSubmitting = true;

    const response =
      venue.id === 'new'
        ? await fetch('/api/venues', { headers: { 'Content-Type': 'application/json' }, method: 'POST', body: JSON.stringify(venue) })
        : await fetch(`/api/venues/${venue.id}`, { headers: { 'Content-Type': 'application/json' }, method: 'PUT', body: JSON.stringify(venue) });

    if (!response.ok) {
      console.error(response);
      isSubmitting = false;
    }

    goto('/');
  }

  async function initMap(mapInstance: MapboxMap) {
    const mapbox = await getMapbox();
    devMode = new URLSearchParams(window.location.search).has('devMode');
    map = mapInstance;

    // Marker
    markerEl = new mapbox.Marker({ draggable: true });
    markerEl.setLngLat([venue.marker[0], venue.marker[1]]).addTo(map);
    map.jumpTo({ center: [venue.marker[0], venue.marker[1]] });
    markerEl.on('dragend', () => {
      const { lng, lat } = markerEl.getLngLat();
      venue.marker = [lng, lat];
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });
    map.addControl(draw, 'top-left');

    if (venue.id !== 'new') {
      draw.add(venue.geometry);
      boundingBox = bbox(venue.geometry) as LngLatBoundsLike;
      map.fitBounds(boundingBox, { padding: { top: 50, bottom: 50, left: 50, right: 50 }, animate: false });
    }

    map.on('draw.create', updateArea);
    map.on('draw.delete', updateArea);
    map.on('draw.update', updateArea);

    function updateArea(e: MapboxDraw.DrawEvent) {
      const data = draw.getAll();

      if (!data.features.length) {
        return;
      }

      if (e.type === 'draw.delete') {
        venue.marker = [];
      }

      venue.geometry = data.features[0].geometry as Polygon;
      boundingBox = bbox(venue.geometry) as LngLatBoundsLike;

      venue.marker = center(data as AllGeoJSON).geometry.coordinates;
      markerEl.setLngLat([venue.marker[0], venue.marker[1]]);
      venue = venue;

      if (draw.getMode() === 'draw_polygon') {
        const pids: any = [];
        const lid = data.features[data.features.length - 1].id;
        data.features.forEach(f => {
          if (f.geometry.type === 'Polygon' && f.id !== lid) {
            pids.push(f.id);
          }
        });
        draw.delete(pids);
      }
    }
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.2.2/mapbox-gl-draw.css" type="text/css" />
</svelte:head>

<div class="flex flex-row flex-1">
  <div class="basis-1/3 flex flex-col min-w-0 px-8 py-6">
    <div class="">
      <h2 class="mb-4">
        <span class="material-icons text-[32px] relative top-[5px] text-[#4264fb] mr-1">location_on</span>
        Venue
        <span class="mb-4 font-light text-gray-400">- #{venue.id}</span>
      </h2>

      <form on:submit|preventDefault={createVenue} class="flex flex-col" autocomplete="off">
        <label class="block mb-4 text-xs font-light text-gray-400 uppercase">
          Venue Name
          <input class="w-full" required type="text" name="name" bind:value={venue.name} placeholder="name" />
        </label>
        <label class="block mb-4 text-xs font-light text-gray-400 uppercase">
          Zoom level
          <input class="w-full" required type="number" name="zoom-level" bind:value={venue.zoomLevel} placeholder="zoom-level" />
        </label>
        <p class="mt-4 mb-2 font-bold">Marker Position</p>

        <label class="block mb-4 text-xs font-light text-gray-400 uppercase">
          Longitude
          <input
            class="w-full"
            required
            type="number"
            name="lng"
            step="0.000000000000000001"
            placeholder="lng"
            bind:value={venue.marker[0]}
            on:change={() => {
              map.jumpTo({ center: [venue.marker[0], venue.marker[1]] });
              markerEl.setLngLat([venue.marker[0], venue.marker[1]]);
            }}
          />
        </label>
        <label class="block mb-4 text-xs font-light text-gray-400 uppercase">
          Latitude
          <input
            class="w-full"
            required
            type="number"
            name="lat"
            step="0.000000000000000001"
            placeholder="lat"
            bind:value={venue.marker[1]}
            on:change={() => {
              map.jumpTo({ center: [venue.marker[0], venue.marker[1]] });
              markerEl.setLngLat([venue.marker[0], venue.marker[1]]);
            }}
          />
        </label>
        <p class="mb-4 font-bold">Click the map to draw a polygon.</p>
        <label for="" class="block mb-4 text-xs font-light text-gray-400 uppercase">Polygon</label>
        <div class="p-4 mb-4 text-xs font-light text-gray-500 bg-gray-200 border">
          <pre>
            {JSON.stringify(
              venue.geometry.coordinates[0].map(c => c[0]),
              null,
              2,
            )}
          </pre>
        </div>
        {#if devMode}
          <label for="" class="block mb-4 text-xs font-light text-gray-400 uppercase">Boundingbox</label>
          <div class="p-4 mb-4 text-xs font-light text-gray-500 bg-gray-200 border">
            <pre>{JSON.stringify(boundingBox, undefined, 2)}</pre>
          </div>
        {/if}

        <button type="submit" class="btn btn-primary" disabled={isSubmitting}>Save</button>
      </form>
    </div>
  </div>

  <div class="flex-1">
    <Map on:mapReady={e => initMap(e.detail)} />
  </div>
</div>

<style>
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>
