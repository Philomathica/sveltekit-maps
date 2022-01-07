// list floors

import clientPromise from '$lib/db/mongo';
import type { FloorLevel, Locals } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const get: RequestHandler<Locals> = async () => {
  const client = await clientPromise;
  const collection = client.db().collection<FloorLevel>('floors');
  const floors = await collection.find<FloorLevel>({}).toArray();

  return {
    status: 200,
    body: JSON.stringify(floors),
  };
};

// create floor
export const post: RequestHandler<Locals, string> = async ({ body }) => {
  const floor = JSON.parse(body);
  const client = await clientPromise;
  const collection = client.db().collection<FloorLevel>('floors');

  const newFloor = { ...floor, id: nanoid(8) };
  await collection.insertOne(newFloor);

  return {
    status: 201,
    headers: {
      location: `/api/floors/${newFloor.id}`,
    },
    body: JSON.stringify(newFloor),
  };
};
