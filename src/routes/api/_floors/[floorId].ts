import clientPromise from '$lib/db/mongo';
import type { Floor, Locals, Typify } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';

// get floor
export const get: RequestHandler<Locals, any, Typify<Floor>> = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<Floor>('floors');
  const floor = await collection.findOne<Floor>({ id: params.floorId }, { projection: { _id: 0 } });

  if (!floor) {
    return { status: 404 };
  }

  return {
    body: floor,
  };
};
