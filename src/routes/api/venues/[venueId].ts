import clientPromise from '$lib/db/mongo';
import type { Floor, Typify, Venue } from '$lib/types';
import { mapbox } from '$lib/variables';
import type { RequestHandler } from '@sveltejs/kit';
import type { Document } from 'mongodb';

// get venue
export const get: RequestHandler<Typify<Venue>> = async ({ params, url }) => {
  const withImage = url.searchParams.get('withImage');
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');
  const projection: Document | undefined = withImage ? { _id: 0 } : { _id: 0 };
  const venue = await collection.findOne<Venue>({ id: params.venueId }, { projection });

  if (!venue) {
    return { status: 404 };
  }

  return {
    body: venue,
  };
};

// put venue
export const put: RequestHandler<Typify<Venue>> = async ({ params, request }) => {
  const venue: Venue = await request.json();
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');

  const updatedVenue: Venue = { ...venue, id: params.venueId };

  await collection.replaceOne({ id: venue.id }, updatedVenue);

  return {
    body: { ...updatedVenue },
  };
};

// delete venue
export const del: RequestHandler = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');
  const venue = await collection.findOne<Venue>({ id: params.venueId }, { projection: { _id: 0 } });
  const floors = await collection.find<Floor>({ id: params.floorId }, { projection: { _id: 0 } }).toArray();

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
