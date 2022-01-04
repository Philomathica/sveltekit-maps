/**
 * Can be made globally available by placing this
 * inside `global.d.ts` and removing `export` keyword
 */
export interface Locals {
  tileset?: string;
}

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
}
