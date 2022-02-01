import clientPromise from '$lib/db/mongo';
import type { Place, Locals, Typify } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

// list Places of Venue
export const get: RequestHandler<Locals, any, Typify<Place[]>> = async ({ params }) => {
  const client = await clientPromise;
  const placeCollection = client.db().collection<Place>('places');
  const places = await placeCollection.find<Place>({ venueId: params.venueId }, { projection: { _id: 0 } }).toArray();

  return {
    body: places,
  };
};

// create place
export const post: RequestHandler<Locals, Place, Typify<Place>> = async ({ params, body }) => {
  const place = body as Place;
  const client = await clientPromise;
  const collection = client.db().collection<Place>('places');

  const newPlace: Place = { ...place, id: nanoid(8) };
  await collection.insertOne({ ...newPlace });

  return {
    status: 201,
    headers: {
      location: `/api/venues/${params.venueId}/places/${newPlace.id}`,
    },
    body: newPlace,
  };
};
