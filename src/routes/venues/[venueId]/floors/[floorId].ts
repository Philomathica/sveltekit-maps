import clientPromise from '$lib/db/mongo';
import { setGeoRefLocData } from '$lib/helpers/georeference';
import type { Typify, Floor, Venue } from '$lib/types';
import { mapbox } from '$lib/variables';
import type { RequestHandler } from '@sveltejs/kit';
import { bbox } from '@turf/turf';

const emptyFloor: Floor = {
  id: 'new',
  venueId: '',
  number: 0,
  filename: '',
  previewImage: '',
  georeference: {
    points: [
      // SW
      { x: 0, y: 0, latitude: 0, longitude: 0 },
      // NE
      { x: 600, y: 400, latitude: 4, longitude: 4 },
    ],
    bbox: [0, 0, 600, 400],
  },
  tilesetId: 'new',
  jobId: '',
  jobResult: '',
  filetype: '',
  universes: [],
};

export const get: RequestHandler<{ venue: Typify<Venue>; floor: Typify<Floor> }> = async ({ params }) => {
  const client = await clientPromise;

  const venueCollection = client.db().collection<Venue>('venues');
  const venue = await venueCollection.findOne<Venue>({ id: params.venueId }, { projection: { _id: 0, previewImage: 0 } });

  if (!venue) {
    return { status: 404 };
  }

  if (params.floorId === 'new') {
    const venueBbox = bbox(venue.geometry) as [number, number, number, number];
    const sw = [venueBbox[0], venueBbox[1]];
    const ne = [venueBbox[2], venueBbox[3]];
    const newFloor = { ...emptyFloor, georeference: setGeoRefLocData(sw, ne, emptyFloor.georeference) };

    return { props: { venue, floor: newFloor } };
  }

  const floorsCollection = client.db().collection<Floor>('floors');
  const floor = await floorsCollection.findOne<Floor>({ id: params.floorId }, { projection: { _id: 0 } });

  if (!floor) {
    return { status: 404 };
  }

  return {
    body: { venue, floor },
  };
};

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
