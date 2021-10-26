import mapbox from 'mapbox-gl';

export interface MapboxContext {
  getMap: () => mapbox.Map;
}

// https://docs.mapbox.com/help/glossary/access-token/
mapbox.accessToken = 'pk.eyJ1IjoibHV1a21vcmV0IiwiYSI6ImNrdXdsMDB1YjJibzkydXM3ZmpuM2s4a3cifQ.q2nBbPsgn9qG6Jqr8EZolA';

const key = {};

export { mapbox, key };
