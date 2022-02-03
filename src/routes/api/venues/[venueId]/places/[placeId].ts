import clientPromise from '$lib/db/mongo';
import type { Typify, Place } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';

// get place
export const get: RequestHandler<Typify<Place>> = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<Place>('places');
  const place = await collection.findOne<Place>({ id: params.placeId }, { projection: { _id: 0 } });

  if (!place) {
    return { status: 404 };
  }

  return {
    body: place,
  };
};

// put place
export const put: RequestHandler<Typify<Place>> = async ({ params, request }) => {
  const place: Place = await request.json();
  const client = await clientPromise;
  const collection = client.db().collection<Place>('places');

  const updatedPlace: Place = { ...place, id: params.placeId };

  await collection.replaceOne({ id: place.id }, updatedPlace);

  return {
    body: { ...updatedPlace },
  };
};

// delete place
export const del: RequestHandler = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<Place>('places');
  const place = await collection.findOne<Place>({ id: params.placeId }, { projection: { _id: 0 } });

  if (!place) {
    return { status: 404 };
  }

  await collection.deleteOne({ id: params.placeId });

  return {
    status: 204,
  };
};
