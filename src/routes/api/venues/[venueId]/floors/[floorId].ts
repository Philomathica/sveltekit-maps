import clientPromise from '$lib/db/mongo';
import type { Typify, Floor } from '$lib/types';
import { mapbox } from '$lib/variables';
import type { RequestHandler } from '@sveltejs/kit';

// get floor
export const get: RequestHandler<Typify<Floor>> = async ({ params }) => {
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

// put floor
export const put: RequestHandler<Typify<Floor>> = async ({ params, request }) => {
  const floor: Floor = await request.json();
  const client = await clientPromise;
  const collection = client.db().collection<Floor>('floors');

  const updatedFloor: Floor = { ...floor, id: params.floorId, venueId: params.venueId };

  await collection.replaceOne({ id: floor.id }, updatedFloor);

  return {
    body: { ...updatedFloor },
  };
};

// delete floor
export const del: RequestHandler = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<Floor>('floors');
  const floor = await collection.findOne<Floor>({ id: params.floorId }, { projection: { _id: 0 } });

  if (!floor) {
    return { status: 404 };
  }

  const response = await fetch(`${mapbox.baseTilesetUrl}/${floor.tilesetId}?access_token=${mapbox.uploadToken}`, { method: 'DELETE' });
  if (!response.ok) {
    console.error('error deleting tileset:', response);
  }

  await collection.deleteOne({ id: params.floorId });

  return {
    status: 204,
  };
};
