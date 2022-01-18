import type { Place } from '$lib/types';

export const emptyPlace: Place = {
  id: 'new',
  floorId: '',
  name: '',
  marker: [0, 0],
  geometry: {
    coordinates: [[[0, 0]]],
    type: 'Polygon',
  },
  universes: [],
};
