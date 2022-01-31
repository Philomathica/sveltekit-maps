import clientPromise from '$lib/db/mongo';
import type { Place, Locals, Typify, Floor } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

// get Places of Venue
export const get: RequestHandler<Locals, any, Typify<Place[]>> = async ({ params }) => {
  const client = await clientPromise;

  const floorCollection = client.db().collection<Place>('floors');
  const floors = await floorCollection.find<Floor>({ venueId: params.venueId }, { projection: { _id: 0 } }).toArray();

  const placeCollection = client.db().collection<Place>('places');
  const places = await placeCollection.find<Place>({ floorId: { $in: floors.map(f => f.id) } }, { projection: { _id: 0 } }).toArray();

  if (!places) {
    return { status: 404 };
  }

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
