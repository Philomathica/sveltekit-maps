import type { RequestHandler } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

import type { Floor, Typify, Venue } from '$lib/types';
import clientPromise from '$lib/db/mongo';

export const get: RequestHandler<{ venue: Typify<Venue>; floors: Typify<Floor[]> }> = async ({ params }) => {
  const client = await clientPromise;
  const venuesCollection = client.db().collection<Venue>('venues');
  const floorsCollection = client.db().collection<Floor>('floors');

  const [venue, floors] = await Promise.all([
    venuesCollection.findOne<Venue>({ id: params.venueId }, { projection: { _id: 0 } }),
    floorsCollection.find<Floor>({ venueId: params.venueId }, { projection: { _id: 0, previewImage: 0 } }).toArray(),
  ]);

  if (!venue) {
    return { status: 404 };
  }

  return {
    body: { venue, floors: floors.sort((a, b) => a.number - b.number) },
  };
};

export const post: RequestHandler<Typify<Floor>> = async ({ params, request }) => {
  const floor: Floor = await request.json();
  const client = await clientPromise;
  const collection = client.db().collection<Floor>('floors');

  const newFloor: Floor = { ...floor, id: nanoid(8), venueId: params.venueId };
  await collection.insertOne({ ...newFloor });

  return {
    status: 201,
    headers: {
      location: `/venues/${params.venueId}/floors/${newFloor.id}`,
    },
    body: newFloor,
  };
};
