<script lang="ts">
  import type { Polygon } from 'geojson';
  import type { Map as MapboxMap, LngLatBoundsLike, Marker } from 'mapbox-gl';
  import type { AllGeoJSON } from '@turf/helpers';
  import MapboxDraw from '@mapbox/mapbox-gl-draw';
  import center from '@turf/center';
  import bbox from '@turf/bbox';

  import type { Venue } from '$lib/types';
  import Map from '$lib/components/maps/Map.svelte';
  import { getMapbox } from '$lib/components/maps/mapbox';
  import { goto } from '$app/navigation';
  import { isPolygon } from 'geojson-validation';
  import { routes } from '$lib/enum-types';

  export let venue: Venue;

  let devMode: boolean;
  let map: MapboxMap;
  let isSubmitting = false;
  let markerEl: Marker;
  let boundingBox: LngLatBoundsLike;

  async function saveVenue() {
    isSubmitting = true;

    const response =
      venue.id === 'new'
        ? await fetch('/venues', { headers: { 'Content-Type': 'application/json' }, method: 'POST', body: JSON.stringify(venue) })
        : await fetch(`/venues/${venue.id}`, { headers: { 'Content-Type': 'application/json' }, method: 'PUT', body: JSON.stringify(venue) });

    if (!response.ok) {
      console.error(response);
    }
    const respVenue = await response.json();

    isSubmitting = false;
    goto(`/${routes.VENUES}/${respVenue.id}`);
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

    if (venue.id !== 'new' && isPolygon(venue.geometry)) {
      draw.add(venue.geometry);
      boundingBox = bbox(venue.geometry) as LngLatBoundsLike;
      map.fitBounds(boundingBox, { padding: { top: 150, bottom: 150, left: 150, right: 150 }, animate: false });
    }

    map.on('draw.create', updateArea);
    map.on('draw.delete', updateArea);
    map.on('draw.update', updateArea);

    function updateArea(e: MapboxDraw.DrawEvent) {
      console.log(e.type);
      const data = draw.getAll();

      if (!data.features.length) {
        return;
      }

      if (e.type === 'draw.delete') {
        venue.marker = [];
      }

      venue.geometry = data.features[0].geometry as Polygon;
      boundingBox = bbox(venue.geometry) as LngLatBoundsLike;

      const centerPoint = center(data as AllGeoJSON).geometry.coordinates;
      markerEl.setLngLat([centerPoint[0], centerPoint[1]]);

      venue.marker = [centerPoint[0], centerPoint[1]];
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

  async function deleteVenue(venue: Venue) {
    const confirm = window.confirm(`Are you sure you want to delete venue ${venue.name}?`);

    if (!confirm) {
      return;
    }

    const response = await fetch(`/${routes.VENUES}/${venue.id}`, { method: 'DELETE' });
    if (!response.ok) {
      return window.alert(`Error deleting place: ${await response.text()}`);
    }

    goto(`/`);
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.2.2/mapbox-gl-draw.css" type="text/css" />
</svelte:head>

<div class="flex flex-row flex-1">
  <div class="flex flex-col w-96 px-8 py-6">
    <h2 class="flex items-center my-4">
      <span class="material-icons text-[32px] relative top-[0px] text-[#4264fb] mr-2">business</span>Venue
      <button class="material-icons text-[16px] relative top-[5px] text-gray-300 ml-auto" on:click={() => deleteVenue(venue)}>delete</button>
    </h2>

    <form on:submit|preventDefault={saveVenue} class="flex flex-col" autocomplete="off">
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
