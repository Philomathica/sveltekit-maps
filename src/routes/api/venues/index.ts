import clientPromise from '$lib/db/mongo';
import type { Locals, Venue } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { nanoid } from 'nanoid';

// list venues
export const get: RequestHandler<Locals> = async () => {
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');
  const venues = await collection.find<Venue>({}).toArray();

  return {
    status: 200,
    body: venues as any,
  };
};

// create venues
export const post: RequestHandler<Locals, string> = async ({ body }) => {
  const venue: Venue = JSON.parse(body);
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');

  const newVenue: Venue = { ...venue, id: nanoid(8) };
  await collection.insertOne({ ...newVenue, _id: new ObjectId() }, {});

  return {
    status: 201,
    headers: {
      location: `/api/venues/${newVenue.id}`,
    },
    body: newVenue as any,
  };
};
