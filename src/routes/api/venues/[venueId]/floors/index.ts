import clientPromise from '$lib/db/mongo';
import type { FloorLevel, Locals, Typify } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

// create floor
export const post: RequestHandler<Locals, FloorLevel, Typify<FloorLevel>> = async ({ params, body }) => {
  const floor = body as FloorLevel;
  const client = await clientPromise;
  const collection = client.db().collection<FloorLevel>('floors');

  const newFloor = { ...floor, id: nanoid(8) };
  await collection.insertOne(newFloor);

  return {
    status: 201,
    headers: {
      location: `/api/venues/${params.venueId}/floors/${newFloor.id}`,
    },
    body: newFloor,
  };
};
