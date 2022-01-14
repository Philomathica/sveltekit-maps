import type mapboxgl from 'mapbox-gl';
import type { Map } from 'mapbox-gl';
import { mapbox as mapbokTokens } from '../../variables';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface MapboxContext {
  getMap: () => Map;
}

async function getMapbox(): Promise<typeof mapboxgl> {
  const mapbox = await import('mapbox-gl');

  mapbox.accessToken = mapbokTokens.accessToken;

  return mapbox;
}
// https://docs.mapbox.com/help/glossary/access-token/

const key = {};

export { getMapbox, key };
