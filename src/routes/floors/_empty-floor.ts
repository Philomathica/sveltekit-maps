import type { FloorLevel } from '$lib/types';

export const emptyFloor: FloorLevel = {
  id: 'new',
  name: '',
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
  tileset: 'new',
  status: '',
  type: '',
};
