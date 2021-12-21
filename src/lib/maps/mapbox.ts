import mapbox from 'mapbox-gl';

import { mapbox as mapbokTokens } from '../variables';

export interface MapboxContext {
  getMap: () => mapbox.Map;
}

// https://docs.mapbox.com/help/glossary/access-token/
mapbox.accessToken = mapbokTokens.accessToken;

const key = {};

export { mapbox, key };
