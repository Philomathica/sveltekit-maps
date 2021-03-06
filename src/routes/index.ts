import type { RequestHandler } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { nanoid } from 'nanoid';
import type { Typify, Venue } from '$lib/types';
import clientPromise from '$lib/db/mongo';

export const get: RequestHandler<{ venues: Typify<Venue[]> }> = async () => {
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');
  const venues = await collection.find<Venue>({}, { projection: { _id: 0 } }).toArray();

  return {
    body: { venues },
  };
};

export const post: RequestHandler<Typify<Venue>> = async ({ request }) => {
  const venue = (await request.json()) as Venue;
  const client = await clientPromise;
  const collection = client.db().collection<Venue>('venues');

  const newVenue: Venue = { ...venue, id: nanoid(8) };
  await collection.insertOne({ ...newVenue, _id: new ObjectId() }, {});

  return {
    status: 201,
    headers: {
      location: `/venues/${newVenue.id}`,
    },
    body: newVenue,
  };
};
