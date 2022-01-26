import clientPromise from '$lib/db/mongo';
import type { Floor, Locals, Typify } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';

// list floors
export const get: RequestHandler<Locals, any, Typify<Floor[]>> = async () => {
  const client = await clientPromise;
  const collection = client.db().collection<Floor>('floors');
  const floors = await collection.find<Floor>({}, { projection: { _id: 0, previewImage: 0 } }).toArray();

  return {
    body: floors,
  };
};
