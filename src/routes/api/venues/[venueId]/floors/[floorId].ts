import clientPromise from '$lib/db/mongo';
import type { FloorLevel, Locals, Typify } from '$lib/types';
import { mapbox } from '$lib/variables';
import type { RequestHandler } from '@sveltejs/kit';

// put floor
export const put: RequestHandler<Locals, FloorLevel, Typify<FloorLevel>> = async ({ params, body }) => {
  const floor = body as FloorLevel;
  const client = await clientPromise;
  const collection = client.db().collection<FloorLevel>('floors');

  const updatedFloor = { ...floor, id: params.floorId };

  await collection.replaceOne({ id: floor.id }, updatedFloor);

  return {
    body: updatedFloor,
  };
};

// delete floor
export const del: RequestHandler<Locals> = async ({ params }) => {
  const client = await clientPromise;
  const collection = client.db().collection<FloorLevel>('floors');

  const floor = await collection.findOne({ id: params.floorId });

  if (!floor) {
    return {
      status: 404,
      body: {
        error: 'floor not found',
      },
    };
  }

  const response = await fetch(`${mapbox.baseTilesetUrl}/${floor.tileset}?access_token=${mapbox.uploadToken}`, { method: 'DELETE' });
  const result = await response.json();

  if (!response.ok) {
    console.error('error deleting tileset:', result);

    return { status: response.status, body: result };
  }

  await collection.deleteOne({ id: params.floorId });

  return {
    status: 204,
  };
};
