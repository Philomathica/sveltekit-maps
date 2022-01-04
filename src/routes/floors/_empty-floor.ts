import type { FloorLevel } from '$lib/types';
import { nanoid } from 'nanoid';

export const emptyFloor: FloorLevel = {
  id: nanoid(8),
  name: '',
  number: 0,
  filename: '',
  georeference: {
    points: [
      { x: 0, y: 0, latitude: 0, longitude: 0 },
      { x: 0, y: 0, latitude: 0, longitude: 0 },
    ],
    bbox: [],
  },
  tileset: 'string',
  status: '',
};
