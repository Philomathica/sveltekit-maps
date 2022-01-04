/* eslint-disable @typescript-eslint/no-explicit-any */
import SphericalMercator from '@mapbox/sphericalmercator';

export interface GeoRefData {
  points: {
    x: number;
    y: number;
    latitude: number;
    longitude: number;
  }[];
  bbox: number[];
}

export function getPositionInfo(georefData: GeoRefData): number[][] {
  return [
    latLngToLngLat(projectPointForGeoreference([georefData.bbox[0], georefData.bbox[3]], georefData)),
    latLngToLngLat(projectPointForGeoreference([georefData.bbox[2], georefData.bbox[3]], georefData)),
    latLngToLngLat(projectPointForGeoreference([georefData.bbox[2], georefData.bbox[1]], georefData)),
    latLngToLngLat(projectPointForGeoreference([georefData.bbox[0], georefData.bbox[1]], georefData)),
  ];
}

export function setGeoRefData(width: number, height: number, sw: number[], ne: number[]): GeoRefData {
  return {
    points: [
      { x: 0, y: 0, longitude: sw[0], latitude: sw[1] }, // SW
      { x: width, y: height, longitude: ne[0], latitude: ne[1] }, // NE
    ],
    bbox: [0, 0, width, height],
  };
}

function projectPointForGeoreference(point: number[], georeference: GeoRefData): any {
  const merc = new SphericalMercator({ size: 256 }); // Coordinate transformation

  const point0 = point;
  const point1 = [georeference.points[0].x, georeference.points[0].y];
  const point2 = [georeference.points[1].x, georeference.points[1].y];
  const latLng1 = [georeference.points[0].latitude, georeference.points[0].longitude];
  const latLng2 = [georeference.points[1].latitude, georeference.points[1].longitude];

  const point12 = subtract(point2, point1);
  const point10 = subtract(point0, point1);
  const point12perpendicular = getPerpendicular(point12);

  const projectParallel = scalarProduct(point12, point10) / (length(point12) * length(point12));
  const projectPerpendicular = scalarProduct(point12perpendicular, point10) / (length(point12perpendicular) * length(point12perpendicular));

  const pxLatLng1 = merc.forward([latLng1[1], latLng1[0]]); //merc is working in lng/lat
  const pxLatLng2 = merc.forward([latLng2[1], latLng2[0]]); //merc is working in lng/lat

  const pxLatLng0: [number, number] = add(
    add(pxLatLng1, multiplyBy(subtract(pxLatLng2, pxLatLng1), projectParallel)),
    multiplyBy(getPerpendicular(subtract(pxLatLng2, pxLatLng1)), projectPerpendicular),
  );
  const latLng0 = merc.inverse(pxLatLng0);

  return [latLng0[1], latLng0[0]];
}

function latLngToLngLat(t: number[]): [number, number] {
  return [t[1], t[0]];
}

function getPerpendicular(vector: number[]): [number, number] {
  return [vector[1], -vector[0]];
}

function length(vector: number[]): number {
  return Math.hypot(vector[0], vector[1]);
}

function scalarProduct(a: number[], b: number[]): number {
  return a[0] * b[0] + a[1] * b[1];
}

function add(a: number[], b: number[]): [number, number] {
  return [a[0] + b[0], a[1] + b[1]];
}

function subtract(a: number[], b: number[]): [number, number] {
  return [a[0] - b[0], a[1] - b[1]];
}

function multiplyBy(vector: number[], scalar: number): [number, number] {
  return [vector[0] * scalar, vector[1] * scalar];
}
