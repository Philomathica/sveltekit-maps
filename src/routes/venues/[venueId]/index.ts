import type { RequestHandler } from '@sveltejs/kit';

import clientPromise from '$lib/db/mongo';
import type { Floor, Typify, Venue } from '$lib/types';
import { mapbox } from '$lib/variables';

const emptyVenue: Venue = {
  id: 'new',
  name: '',
  zoomLevel: 17,
  marker: [2.3283084, 48.8776899],
  geometry: { coordinates: [[[0, 0]]], type: 'Polygon' },
};

export const get: RequestHandler<{ venue: Typify<Venue> }> = async ({ params }) => {
  if (params.venueId === 'new') {
    return { body: { venue: emptyVenue } };
  }

  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');
  const venue = await collection.findOne<Venue>({ id: params.venueId }, { projection: { _id: 0 } });

  if (!venue) {
    return { status: 404 };
  }

  return {
    body: { venue },
  };
};

export const put: RequestHandler<Typify<Venue>> = async ({ params, request }) => {
  const venue: Venue = await request.json();
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');

  const updatedVenue: Venue = { ...venue, id: params.venueId };

  await collection.replaceOne({ id: venue.id }, updatedVenue);

  return {
    body: updatedVenue,
  };
};

export const del: RequestHandler = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');
  const venue = await collection.findOne<Venue>({ id: params.venueId }, { projection: { _id: 0 } });
  const floors = await collection.find<Floor>({ id: params.floorId }, { projection: { _id: 0, previewImage: 0 } }).toArray();

  if (!venue) {
    return { status: 404 };
  }

  await Promise.all(
    floors.map(async floor => {
      const response = await fetch(`${mapbox.baseTilesetUrl}/${floor.tilesetId}?access_token=${mapbox.uploadToken}`, { method: 'DELETE' });

      if (!response.ok) {
        console.error('error deleting tileset:', response);
      }

      return await response.json();
    }),
  );

  await collection.deleteOne({ id: params.venueId });

  return {
    status: 204,
  };
};
