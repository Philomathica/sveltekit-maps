import type { FloorLevel } from '$lib/types';
import { nanoid } from 'nanoid';

export const emptyFloor: FloorLevel = {
  id: nanoid(8),
  name: '',
  number: 0,
  filename: '',
  georeference: {
    points: [
      // SW
      { x: 0, y: 0, latitude: 0, longitude: 0 },
      // NE
      { x: 600, y: 400, latitude: 4, longitude: 4 },
    ],
    bbox: [0, 0, 600, 400],
  },
  tileset: 'string',
  status: '',
};
