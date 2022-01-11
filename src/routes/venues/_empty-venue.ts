import type { Venue } from '$lib/types';

export const emptyVenue: Venue = {
  id: 'new',
  name: '',
  floors: [],
  coordinates: { lat: 0, lng: 0 },
};
