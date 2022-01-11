import type { Venue } from '$lib/types';

export const emptyVenue: Omit<Venue, 'id'> = {
  name: '',
  floors: [],
  coordinates: { lat: 0, lng: 0 },
};
