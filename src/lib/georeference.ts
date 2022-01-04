/* eslint-disable @typescript-eslint/no-explicit-any */
import { cloneDeep, map } from 'lodash';
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

/**
 *  Coordinate transformation
 */
const merc = new SphericalMercator({
  size: 256,
});

function getPerpendicular(vector: any) {
  return [vector[1], -vector[0]];
}

function length(vector: any) {
  return Math.hypot(vector[0], vector[1]);
}

function scalarProduct(a: any, b: any) {
  return a[0] * b[0] + a[1] * b[1];
}

// function angleBetween(a, b) {
//   return Math.acos(scalarProduct(a, b) / (length(a) * length(b)));
// }

// a + b
function add(a: any, b: any) {
  return [a[0] + b[0], a[1] + b[1]];
}

// a - b
function subtract(a: any, b: any) {
  return [a[0] - b[0], a[1] - b[1]];
}

// scalar * vector
function multiplyBy(vector: any, scalar: any) {
  return [vector[0] * scalar, vector[1] * scalar];
}

export function projectPointForGeoreference(point: number[], georeference: GeoRefData): any {
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

  const pxLatLng0: any = add(
    add(pxLatLng1, multiplyBy(subtract(pxLatLng2, pxLatLng1), projectParallel)),
    multiplyBy(getPerpendicular(subtract(pxLatLng2, pxLatLng1)), projectPerpendicular),
  );
  const latLng0 = merc.inverse(pxLatLng0);

  return [latLng0[1], latLng0[0]];
}

export function projectFeatureForGeoreference(feature: any, georeference: GeoRefData): any {
  const _feature = cloneDeep(feature);

  if (_feature.geometry.type === 'Point') {
    const projectedPoint = projectPointForGeoreference(_feature.geometry.coordinates, georeference);
    _feature.geometry.coordinates = [projectedPoint[1], projectedPoint[0]]; //GeoJSON is lng/lat
  } else if (_feature.geometry.type === 'Polygon') {
    _feature.geometry.coordinates = map(_feature.geometry.coordinates, function (innerPolygon) {
      return map(innerPolygon, function (point) {
        const projectedPoint = projectPointForGeoreference(point, georeference);
        return [projectedPoint[1], projectedPoint[0]]; //GeoJSON is lng/lat
      });
    });
  } else if (_feature.geometry) {
    console.log('GEOMETRY TYPE NOT SUPPORTED ' + feature.geometry.type);
  } else {
    console.log('GEOMETRY TYPE NOT SUPPORTED NULL');
  }

  return _feature;
}

export function unprojectLatLngForGeoreference(latLng: any, georeference: GeoRefData): any {
  const latLng0 = latLng;
  const point1 = [georeference.points[0].x, georeference.points[0].y];
  const point2 = [georeference.points[1].x, georeference.points[1].y];
  const latLng1 = [georeference.points[0].latitude, georeference.points[0].longitude];
  const latLng2 = [georeference.points[1].latitude, georeference.points[1].longitude];

  const pxLatLng0 = merc.forward([latLng0[1], latLng0[0]]); //merc is working in lng/lat
  const pxLatLng1 = merc.forward([latLng1[1], latLng1[0]]); //merc is working in lng/lat
  const pxLatLng2 = merc.forward([latLng2[1], latLng2[0]]); //merc is working in lng/lat

  const pxLatLng12 = subtract(pxLatLng2, pxLatLng1);
  const pxLatLng10 = subtract(pxLatLng0, pxLatLng1);
  const pxLatLng12perpendicular = getPerpendicular(pxLatLng12);

  const projectParallel = scalarProduct(pxLatLng12, pxLatLng10) / (length(pxLatLng12) * length(pxLatLng12));
  const projectPerpendicular =
    scalarProduct(pxLatLng12perpendicular, pxLatLng10) / (length(pxLatLng12perpendicular) * length(pxLatLng12perpendicular));

  const point0 = add(
    add(point1, multiplyBy(subtract(point2, point1), projectParallel)),
    multiplyBy(getPerpendicular(subtract(point2, point1)), projectPerpendicular),
  );

  return point0;
}

export function unprojectFeatureForGeoreference(feature: any, georeference: GeoRefData): any {
  const _feature = cloneDeep(feature);

  if (_feature.geometry.type === 'Point') {
    const projectedPoint = unprojectLatLngForGeoreference([_feature.geometry.coordinates[1], _feature.geometry.coordinates[0]], georeference);
    _feature.geometry.coordinates = [projectedPoint[1], projectedPoint[0]]; //GeoJSON is lng/lat
  } else if (_feature.geometry.type === 'Polygon') {
    _feature.geometry.coordinates = map(_feature.geometry.coordinates, function (innerPolygon) {
      return map(innerPolygon, (point: any) => {
        const projectedPoint = unprojectLatLngForGeoreference([point[1], point[0]], georeference); //GeoJSON is lng/lat
        return projectedPoint;
      });
    });
  } else if (_feature.geometry) {
    console.log('GEOMETRY TYPE NOT SUPPORTED ' + feature.geometry.type);
  } else {
    console.log('GEOMETRY TYPE NOT SUPPORTED NULL');
  }

  return _feature;
}

export function latLngToLngLat(t: any): any {
  return [t[1], t[0]];
}
