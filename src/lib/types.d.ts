import type { Polygon, Position } from 'geojson';
import type { LongLatLike } from 'mapbox-gl';

/**
 * Can be made globally available by placing this
 * inside `global.d.ts` and removing `export` keyword
 */

export type Typify<T> = { [K in keyof T]: Typify<T[K]> };

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

export interface Venue {
  id: string;
  name: string;
  zoomLevel: number;
  marker: Position | LongLatLike;
  geometry: Polygon;
}

export interface Floor {
  id: string;
  venueId: string;
  number: number;
  status: string;
  filename: string;
  tileset: string;
  jobId: string;
  jobResult: string;
  previewImage?: string;
  type: string;
  georeference: Georeference;
  places: Place[];
}

export interface Place {
  id: string;
  floorId: string;
  name: string;
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
