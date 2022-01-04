<script lang="ts">
  /* eslint-disable @typescript-eslint/no-explicit-any */
  import { onMount, setContext } from 'svelte';
  import { mapbox, key, MapboxContext } from './mapbox';

  import type { GeoRefData } from '../georeference';

  import { getMarkersPosInfo, gcpsToFeatureCollection, getBoundingboxFeatures } from '$lib/helpers';

  setContext<MapboxContext>(key, {
    getMap: () => map,
  });

  export let gcps: string[];

  let container: HTMLElement;
  let map: mapbox.Map;

  onMount(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/mapbox-gl/dist/mapbox-gl.css';

    link.onload = () => {
      map = new mapbox.Map({
        container,
        style: 'mapbox://styles/mapbox/streets-v9',
        center: [0, 0],
        zoom: 3.5,
      });
    };

    document.head.appendChild(link);

    return () => {
      map.remove();
      link.parentNode.removeChild(link);
    };
  });

  export function addSourceWithLayer(sourceId: string, source: mapbox.AnySourceData, layer: mapbox.AnyLayer) {
    map.addSource(sourceId, source);
    map.addLayer(layer);
  }

  export function flyTo(center: mapbox.LngLatLike, zoom = 7) {
    map.flyTo({ center, zoom });
  }

  export function dragImage(sourceId: string, georefData: GeoRefData) {
    const markerBL = new mapbox.Marker({
      draggable: true,
      anchor: 'bottom',
      offset: [0, 0] as mapbox.PointLike,
    })
      .setLngLat(new mapbox.LngLat(georefData.points[0].longitude, georefData.points[0].latitude))
      .addTo(map);

    const markerTR = new mapbox.Marker({
      draggable: true,
      anchor: 'bottom',
      offset: [0, 0] as mapbox.PointLike,
    })
      .setLngLat(new mapbox.LngLat(georefData.points[1].longitude, georefData.points[1].latitude))
      .addTo(map);

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

    const cornerPoints: mapbox.LngLatLike[] = [
      [+upperLX, +upperLY], // 1
      [+upperRX, +upperRY], // 2
      [+lowerRX, +lowerRY], // 3
      [+lowerLX, +lowerLY], // 4
    ];

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

    const helperPoints = gcpsToFeatureCollection(upperLX, upperLY, upperRX, upperRY, lowerRX, lowerRY, lowerLX, lowerLY);

    if (!map.getSource('pointSource')) {
      map.addSource('pointSource', {
        type: 'geojson',
        data: helperPoints as any,
      });
    } else {
      (map.getSource('pointSource') as any).setData(helperPoints);
    }

    if (!map.getLayer('pointsLayer')) {
      map.addLayer({
        id: 'pointsLayer',
        type: 'circle',
        source: 'pointSource',
        paint: {
          'circle-radius': 20,
          'circle-color': '#fff',
          'circle-opacity': 0.5,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ccc',
        },
      });

      map.addLayer({
        id: 'labels',
        type: 'symbol',
        source: 'pointSource',
        layout: {
          'text-field': ['get', 'description'],
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          'text-radial-offset': 0,
          'text-justify': 'auto',
        },
      });
    }

    // Draw bounding box
    const bboxFeatureCollection = getBoundingboxFeatures(cornerPoints);

    if (!map.getSource('bboxSource')) {
      map.addSource('bboxSource', {
        type: 'geojson',
        data: bboxFeatureCollection as any,
      });
    } else {
      (map.getSource('bboxSource') as any).setData(bboxFeatureCollection);
    }

    if (!map.getLayer('bboxLayer')) {
      map.addLayer({
        id: 'bboxLayer',
        type: 'circle',
        source: 'bboxSource',
        paint: {
          'circle-radius': 5,
          'circle-color': '#000',
          'circle-opacity': 1,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#0F0',
        },
      });
    }
  }
</script>

<div class="w-full h-full" bind:this={container}>
  {#if map}
    <slot />
  {/if}
</div>
