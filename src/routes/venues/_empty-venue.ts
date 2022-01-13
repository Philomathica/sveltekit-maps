import type { Venue } from '$lib/types';

export const emptyVenue: Venue = {
  id: 'new',
  name: '',
  floors: [],
  zoomLevel: 17,
  marker: [2.3283084, 48.8776899],
  geometry: {
    coordinates: [[[0, 0]]],
    type: 'Polygon',
  },
};
