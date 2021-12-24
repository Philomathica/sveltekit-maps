<script lang="ts">
  import type { ImageSource, PointLike } from 'mapbox-gl';

  import { onMount, setContext } from 'svelte';
  import { mapbox, key, MapboxContext } from './mapbox';
  import { projectPointForGeoreference, GeoRefData } from './georeference';

  setContext<MapboxContext>(key, {
    getMap: () => map,
  });

  export let zoom: number;

  export let upperLeftX: string;
  export let upperLeftY: string;
  export let lowerRightX: string;
  export let lowerRightY: string;

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
        zoom,
      });
    };

    document.head.appendChild(link);

    return () => {
      map.remove();
      link.parentNode.removeChild(link);
    };
  });

  export function goToLocation(lngLat: mapbox.LngLatLike, addMarker = false, zoom = 20) {
    const popup = new mapbox.Popup({ offset: 25 }).setText('hi');
    if (addMarker) {
      new mapbox.Marker().setLngLat(lngLat).setPopup(popup).addTo(map);
    }
    map.flyTo({ center: lngLat, zoom });
  }

  export function addLayer(sourceId: string, source: mapbox.AnySourceData, layer: mapbox.AnyLayer) {
    map.addSource(sourceId, source);
    map.addLayer(layer);
  }

  export function dragImage(sourceId: string, layerId: string, georefData: GeoRefData) {
    const markerElBL = document.createElement('div');
    markerElBL.style.cssText = 'width: 10px; height: 10px; background: #f00';

    const markerBL = new mapbox.Marker({
      // element: markerElBL,
      draggable: true,
      anchor: 'bottom',
      offset: [0, 0] as PointLike,
    })
      .setLngLat(new mapbox.LngLat(georefData.points[0].longitude, georefData.points[0].latitude))
      .addTo(map);

    const markerElTopR = document.createElement('div');
    markerElTopR.style.cssText = 'width: 10px; height: 10px; background: #00f';

    const markerTR = new mapbox.Marker({
      // element: markerElTopR,
      draggable: true,
      anchor: 'bottom',
      offset: [0, 0] as PointLike,
    })
      .setLngLat(new mapbox.LngLat(georefData.points[1].longitude, georefData.points[1].latitude))
      .addTo(map);

    // const canvas = map.getCanvasContainer();

    markerBL.on('drag', () => {
      const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
      (map.getSource(sourceId) as ImageSource).setCoordinates(posInfo);
    });

    markerTR.on('drag', () => {
      const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
      (map.getSource(sourceId) as ImageSource).setCoordinates(posInfo);
    });

    markerBL.on('dragend', () => {
      const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
      upperLeftX = posInfo[0][0].toString();
      upperLeftY = posInfo[0][1].toString();
      lowerRightX = posInfo[2][0].toString();
      lowerRightY = posInfo[2][1].toString();

      updatePointsSource(posInfo);
    });

    markerTR.on('dragend', () => {
      const posInfo = getMarkersPosInfo(markerBL, markerTR, georefData);
      upperLeftX = posInfo[0][0].toString();
      upperLeftY = posInfo[0][1].toString();
      lowerRightX = posInfo[2][0].toString();
      lowerRightY = posInfo[2][1].toString();
      updatePointsSource(posInfo);
    });
  }

  function updatePointsSource(posInfo) {
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

    console.log('posInfo', posInfo);
    console.log('1:', upperLX, upperLY, '\n', '2:', upperRX, upperRY, '\n', '3:', lowerRX, lowerRY, '\n', '4:', lowerLX, lowerLY);

    const helperPoints = {
      type: 'FeatureCollection',
      features: [
        // NW (initial pos)
        {
          type: 'Feature',
          properties: { description: '1' },
          geometry: {
            type: 'Point',
            coordinates: [+upperLX, +upperLY],
          },
        },
        // NE (initial pos)
        {
          type: 'Feature',
          properties: { description: '2' },
          geometry: {
            type: 'Point',
            coordinates: [+upperRX, +upperRY],
          },
        },
        // SE (initial pos)
        {
          type: 'Feature',
          properties: { description: '3' },
          geometry: {
            type: 'Point',
            coordinates: [+lowerRX, +lowerRY],
          },
        },
        // SW (initial pos)
        {
          type: 'Feature',
          properties: { description: '4' },
          geometry: {
            type: 'Point',
            coordinates: [+lowerLX, +lowerLY],
          },
        },
      ],
    };

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
    const c = [
      [+upperLX, +upperLY], // 1
      [+upperRX, +upperRY], // 2
      [+lowerRX, +lowerRY], // 3
      [+lowerLX, +lowerLY], // 4
    ];
    const bounds = c.reduce((r, a) => r.extend(a as any), new mapbox.LngLatBounds(c[0] as any, c[0] as any));
    const bboxP1 = [bounds.getWest(), bounds.getNorth()];
    const bboxP2 = [bounds.getEast(), bounds.getNorth()];
    const bboxP3 = [bounds.getEast(), bounds.getSouth()];
    const bboxP4 = [bounds.getWest(), bounds.getSouth()];

    console.log('bbox:', bboxP1, bboxP2, bboxP3, bboxP4);

    const bboxPoints = {
      type: 'FeatureCollection',
      features: [
        // NW (initial pos)
        {
          type: 'Feature',
          properties: { description: '1' },
          geometry: {
            type: 'Point',
            coordinates: bboxP1,
          },
        },
        {
          type: 'Feature',
          properties: { description: '2' },
          geometry: {
            type: 'Point',
            coordinates: bboxP2,
          },
        },
        {
          type: 'Feature',
          properties: { description: '3' },
          geometry: {
            type: 'Point',
            coordinates: bboxP3,
          },
        },
        {
          type: 'Feature',
          properties: { description: '4' },
          geometry: {
            type: 'Point',
            coordinates: bboxP4,
          },
        },
      ],
    };

    if (!map.getSource('bboxSource')) {
      map.addSource('bboxSource', {
        type: 'geojson',
        data: bboxPoints as any,
      });
    } else {
      (map.getSource('bboxSource') as any).setData(bboxPoints);
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

  export function getPositionInfo(georefData: GeoRefData): number[][] {
    return [
      latLngToLngLat(projectPointForGeoreference([georefData.bbox[0], georefData.bbox[3]], georefData)),
      latLngToLngLat(projectPointForGeoreference([georefData.bbox[2], georefData.bbox[3]], georefData)),
      latLngToLngLat(projectPointForGeoreference([georefData.bbox[2], georefData.bbox[1]], georefData)),
      latLngToLngLat(projectPointForGeoreference([georefData.bbox[0], georefData.bbox[1]], georefData)),
    ];
  }

  export function getMarkersPosInfo(markerBL: mapbox.Marker, markerTR: mapbox.Marker, georefData: GeoRefData): number[][] {
    const { lng: lngBL, lat: latBL } = markerBL.getLngLat();
    const { lng: lngTR, lat: latTR } = markerTR.getLngLat();
    const newGeoRefData = {
      points: [
        {
          x: 0,
          y: 0,
          // SW
          longitude: lngBL,
          latitude: latBL,
        },
        {
          x: georefData.bbox[2], // width,
          y: georefData.bbox[3], // height,
          // NE
          longitude: lngTR,
          latitude: latTR,
        },
      ],
      bbox: georefData.bbox,
    };

    return getPositionInfo(newGeoRefData);
  }

  export function latLngToLngLat(t): any {
    return [t[1], t[0]];
  }
</script>

<div class="w-full h-full" bind:this={container}>
  {#if map}
    <slot />
  {/if}
</div>
