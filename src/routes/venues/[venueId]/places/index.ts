import clientPromise from '$lib/db/mongo';
import type { Floor, Place, Typify, Venue } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const get: RequestHandler<{ venue: Typify<Venue>; floors: Typify<Floor[]>; places: Typify<Place[]> }> = async ({ params }) => {
  const client = await clientPromise;
  const venuesCollection = client.db().collection<Venue>('venues');
  const floorsCollection = client.db().collection<Floor>('floors');
  const placesollection = client.db().collection<Place>('places');

  const [venue, floors, places] = await Promise.all([
    venuesCollection.findOne<Venue>({ id: params.venueId }, { projection: { _id: 0 } }),
    floorsCollection.find<Floor>({ venueId: params.venueId }, { projection: { _id: 0, previewImage: 0 } }).toArray(),
    placesollection.find<Place>({}, { projection: { _id: 0 } }).toArray(),
  ]);

  if (!venue) {
    return { status: 404 };
  }

  return {
    body: { venue, floors, places },
  };
};

export const post: RequestHandler<Typify<Place>> = async ({ params, request }) => {
  const place: Place = await request.json();
  const client = await clientPromise;
  const collection = client.db().collection<Place>('places');

  const newPlace: Place = { ...place, id: nanoid(8) };
  await collection.insertOne({ ...newPlace });

  return {
    status: 201,
    headers: {
      location: `/venues/${params.venueId}/places/${newPlace.id}`,
    },
    body: newPlace,
  };
};
