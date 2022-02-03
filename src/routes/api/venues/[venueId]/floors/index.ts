import clientPromise from '$lib/db/mongo';
import type { Floor, Typify } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

// get Floors of Venue
export const get: RequestHandler<Typify<Floor[]>> = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<Floor>('floors');
  const floors = await collection.find<Floor>({ venueId: params.venueId }, { projection: { _id: 0 } }).toArray();

  return {
    body: floors,
  };
};

// create floor for Venue
export const post: RequestHandler<Typify<Floor>> = async ({ params, request }) => {
  const floor: Floor = await request.json();
  const client = await clientPromise;
  const collection = client.db().collection<Floor>('floors');

  const newFloor: Floor = { ...floor, id: nanoid(8), venueId: params.venueId };
  await collection.insertOne({ ...newFloor });

  return {
    status: 201,
    headers: {
      location: `/api/venues/${params.venueId}/floors/${newFloor.id}`,
    },
    body: newFloor,
  };
};
