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
  number: number;
  status: string;
  georeference?: Georeference;
  filename?: string;
  tileset?: string;
  previewImage?: string;
  type?: string;
}

export interface Venue {
  id: string;
  name: string;
  coordinates: { lng: number; lat: number };
  floors: FloorLevel[];
}
