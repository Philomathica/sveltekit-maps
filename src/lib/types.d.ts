import type { Polygon, Point } from 'geojson';

/**
 * Can be made globally available by placing this
 * inside `global.d.ts` and removing `export` keyword
 */

export type Typify<T> = { [K in keyof T]: Typify<T[K]> };

export interface ReferencePoint {
  x: number;
  y: number;
  latitude: number;
  longitude: number;
}

export interface Georeference {
  points: ReferencePoint[];
  bbox: number[];
}

export interface Venue {
  id: string;
  name: string;
  zoomLevel: number;
  marker: number[];
  geometry: Polygon;
}

export interface Floor {
  id: string;
  venueId: string;
  number: number;
  georeference: Georeference;
  universes: string[];
  previewImage?: string;
  tilesetId: string;
  filename: string;
  filetype: string;
  jobId: string;
  jobResult: string;
}

export interface Place {
  id: string;
  floorId: string;
  venueId?: string;
  name: string;
  universes: string[];
  marker: number[];
  geometry: Polygon | Point;
}

export interface MapboxJobStatus {
  id: string;
  name: string;
  complete: boolean;
  error?: any;
  created: Date;
  modified: Date;
  tileset: string;
  owner: string;
  progress: number;
}
