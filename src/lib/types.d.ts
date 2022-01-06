/**
 * Can be made globally available by placing this
 * inside `global.d.ts` and removing `export` keyword
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Locals {}

export interface Point {
  x: number;
  y: number;
  latitude: number;
  longitude: number;
}

export interface Georeference {
  points: Point[];
  bbox: number[];
}

export interface FloorLevel {
  id: string;
  name: string;
  number: number;
  filename: string;
  georeference: Georeference;
  tileset: string;
  status: string;
  previewImage: string;
}
