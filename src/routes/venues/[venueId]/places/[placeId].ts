import clientPromise from '$lib/db/mongo';
import type { Typify, Place, Venue, Floor } from '$lib/types';
import type { RequestHandler } from '@sveltejs/kit';

const emptyPlace: Place = {
  id: 'new',
  floorId: '',
  name: '',
  marker: [0, 0],
  geometry: { coordinates: [[[0, 0]]], type: 'Polygon' },
  universes: [],
};

export const get: RequestHandler<{ venue: Typify<Venue>; floors: Typify<Floor[]>; place: Typify<Place> }> = async ({ params }) => {
  const client = await clientPromise;

  const venuesCollection = client.db().collection<Venue>('venues');
  const floorsCollection = client.db().collection<Floor>('floors');

  const [venue, floors] = await Promise.all([
    venuesCollection.findOne<Venue>({ id: params.venueId }, { projection: { _id: 0 } }),
    floorsCollection.find<Floor>({ venueId: params.venueId }, { projection: { _id: 0, previewImage: 0 } }).toArray(),
  ]);

  if (!venue || !floors) {
    return { status: 404 };
  }

  if (params.placeId === 'new') {
    return { props: { venue, floors, place: emptyPlace } };
  }

  const placeCollection = client.db().collection<Place>('places');
  const place = await placeCollection.findOne<Place>({ id: params.placeId }, { projection: { _id: 0 } });

  if (!place) {
    return { status: 404 };
  }

  return {
    body: { venue, floors, place },
  };
};

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
