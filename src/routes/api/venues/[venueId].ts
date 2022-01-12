import clientPromise from '$lib/db/mongo';
import type { Locals, Typify, Venue } from '$lib/types';
import { mapbox } from '$lib/variables';
import type { RequestHandler } from '@sveltejs/kit';

// get venue
export const get: RequestHandler<Locals, any, Typify<Venue>> = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');
  const venue = await collection.findOne<Venue>({ id: params.venueId }, { projection: { _id: 0 } });

  if (!venue) {
    return { status: 404 };
  }

  return {
    body: venue,
  };
};

// put venue
export const put: RequestHandler<Locals, Venue, Typify<Venue>> = async ({ params, body }) => {
  const venue = body as Venue;
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');

  const updatedVenue: Venue = { ...venue, id: params.venueId };

  await collection.replaceOne({ id: venue.id }, updatedVenue);

  return {
    body: { ...updatedVenue },
  };
};

// delete venue
export const del: RequestHandler<Locals> = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');
  const venue = await collection.findOne<Venue>({ id: params.venueId }, { projection: { _id: 0 } });

  if (!venue) {
    return { status: 404 };
  }

  await Promise.all(
    venue.floors.map(async floor => {
      const response = await fetch(`${mapbox.baseTilesetUrl}/${floor.tileset}?access_token=${mapbox.uploadToken}`, { method: 'DELETE' });

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