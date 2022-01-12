import type { Venue } from '$lib/types';

export const emptyVenue: Venue = {
  id: 'new',
  name: '',
  floors: [],
  marker:  [0,0],
  geometry: {
    coordinates: [[[0,0]]],
    type: 'Polygon'
  }
};
