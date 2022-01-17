import clientPromise from '$lib/db/mongo';
import type { Place, Locals, Typify } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';

// list places
export const get: RequestHandler<Locals, any, Typify<Place[]>> = async () => {
  const client = await clientPromise;
  const collection = client.db().collection<Place>('places');
  const places = await collection.find<Place>({}, { projection: { _id: 0 } }).toArray();

  return {
    body: places,
  };
};
