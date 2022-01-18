import clientPromise from '$lib/db/mongo';
import type { Floor, Locals, Typify } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';

// list floors
export const get: RequestHandler<Locals, any, Typify<Floor[]>> = async () => {
  const client = await clientPromise;
  const collection = client.db().collection<Floor>('floors');
  const venues = await collection.find<Floor>({}, { projection: { _id: 0, 'floors.previewImage': 0 } }).toArray();

  return {
    body: venues,
  };
};
