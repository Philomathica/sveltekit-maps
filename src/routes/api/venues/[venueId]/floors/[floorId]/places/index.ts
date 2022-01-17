import clientPromise from '$lib/db/mongo';
import type { Place, Locals, Typify } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

// create floors
export const post: RequestHandler<Locals, Place, Typify<Place>> = async ({ params, body }) => {
  const place = body as Place;
  const client = await clientPromise;
  const collection = client.db().collection<Place>('places');

  const newPlace: Place = { ...place, id: nanoid(8), floorId: params.floorId };
  await collection.insertOne({ ...newPlace });

  return {
    status: 201,
    headers: {
      location: `/api/venues/${params.venueId}/floors/${newPlace.id}/places/${newPlace.id}`,
    },
    body: newPlace,
  };
};
