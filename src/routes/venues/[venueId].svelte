<script context="module" lang="ts">
  import type { Venue } from '$lib/types';
  import type { Load } from '@sveltejs/kit';
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
  import type { Map as MapboxMap } from 'mapbox-gl';
  import MapboxDraw from '@mapbox/mapbox-gl-draw';
  import Map from '$lib/maps/Map.svelte';
  import center from '@turf/center';
  import area from '@turf/area';
  import type { AllGeoJSON } from '@turf/helpers';

  export let venue: Venue;

  let map: MapboxMap;
  let isSubmitting = false;
  let roundedArea: number;
  let centerPoint: number[];

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
    map = mapInstance;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      // Select which mapbox-gl-draw control buttons to add to the map.
      controls: {
        polygon: true,
        trash: true,
      },
      // Set mapbox-gl-draw to draw by default.
      // The user does not have to click the polygon control button first.
      defaultMode: 'draw_polygon',
    });
    map.addControl(draw);

    map.on('draw.create', updateArea);
    map.on('draw.delete', updateArea);
    map.on('draw.update', updateArea);

    function updateArea() {
      const data = draw.getAll();

      if (!data.features.length) {
        return;
      }

      roundedArea = Math.round(area(data) * 100) / 100;
      centerPoint = center(data as AllGeoJSON).geometry.coordinates;
      venue.coordinates.lng = centerPoint[0];
      venue.coordinates.lat = centerPoint[1];
      venue = venue;
    }
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.2.2/mapbox-gl-draw.css" type="text/css" />
</svelte:head>

<div class="flex flex-row h-full">
  <div class="px-8 py-6">
    <h2 class="mb-4">{venue.id}</h2>

    <form on:submit|preventDefault={createVenue} class="flex flex-col" autocomplete="off">
      <label class="block mb-4 text-gray-400">
        Venue Name
        <input class="w-full" required type="text" name="name" bind:value={venue.name} placeholder="name" />
      </label>
      <label class="block mb-4 text-gray-400">
        Longitude
        <input
          class="w-full"
          required
          type="number"
          name="lng"
          bind:value={venue.coordinates.lng}
          placeholder="lng"
          on:change={() => map.flyTo({ center: [venue.coordinates.lng, venue.coordinates.lat] })}
        />
      </label>
      <label class="block mb-4 text-gray-400">
        Latitude
        <input
          class="w-full"
          required
          type="number"
          name="lat"
          bind:value={venue.coordinates.lat}
          placeholder="lat"
          on:change={() => map.flyTo({ center: [venue.coordinates.lng, venue.coordinates.lat] })}
        />
      </label>
      <p class="mb-4 font-bold">Click the map to draw a polygon.</p>

      <div class=" block mb-4">
        {#if roundedArea}
          <span class="block text-gray-400">Area</span>{roundedArea} ㎡
        {/if}
      </div>

      {#if centerPoint}
        <div class="block mb-4">
          <span class="block text-gray-400">lng</span>
          {centerPoint[0]}
          <span class="block text-gray-400">lat</span>
          {centerPoint[1]}
        </div>
      {/if}

      <button type="submit" class="btn btn-primary" disabled={isSubmitting}>Save</button>
    </form>
  </div>

  <div class="flex-1">
    <Map on:mapReady={e => initMap(e.detail)} />
  </div>
</div>
