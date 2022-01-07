import clientPromise from '$lib/db/mongo';
import type { FloorLevel, Locals } from '$lib/types';
import { mapbox } from '$lib/variables';
import type { RequestHandler } from '@sveltejs/kit';

// get floor
export const get: RequestHandler<Locals> = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<FloorLevel>('floors');
  const floor = await collection.findOne<FloorLevel>({ id: params.id }, { projection: { _id: 0 } });

  return {
    status: 200,
    body: JSON.stringify(floor),
  };
};

// put floor
export const put: RequestHandler<Locals, string> = async ({ params, body }) => {
  const floor: FloorLevel = JSON.parse(body);
  const client = await clientPromise;
  const collection = client.db().collection<FloorLevel>('floors');

  const updatedFloor = { ...floor, id: params.id };

  await collection.replaceOne({ id: floor.id }, updatedFloor);

  return {
    status: 200,
    body: JSON.stringify(updatedFloor),
  };
};

// delete floor
export const del: RequestHandler<Locals> = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<FloorLevel>('floors');

  const floor = await collection.findOne({ id: params.id });

  const response = await fetch(`${mapbox.baseTilesetUrl}/${floor.tileset}?access_token=${mapbox.uploadToken}`, { method: 'DELETE' });
  const result = await response.json();

  if (!response.ok) {
    console.error('error deleting tileset:', result);

    return { status: response.status, body: result };
  }

  await collection.deleteOne({ id: params.id });

  return {
    status: 204,
  };
};
