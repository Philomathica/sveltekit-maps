import clientPromise from '$lib/db/mongo';
import type { Locals, Venue } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';

// get venue
export const get: RequestHandler<Locals> = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');
  const venue = await collection.findOne<Venue>({ id: params.id }, { projection: { _id: 0 } });

  return {
    status: 200,
    body: JSON.stringify(venue),
  };
};

// put venue
export const put: RequestHandler<Locals, string> = async ({ params, body }) => {
  const venue: Venue = JSON.parse(body);
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');

  const updatedVenue = { ...venue, id: params.id };

  await collection.replaceOne({ id: venue.id }, updatedVenue);

  return {
    status: 200,
    body: JSON.stringify(updatedVenue),
  };
};

// delete venue
export const del: RequestHandler<Locals> = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');

  await collection.deleteOne({ id: params.id });

  return {
    status: 204,
  };
};
