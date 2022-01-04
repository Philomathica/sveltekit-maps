/* eslint-disable @typescript-eslint/no-explicit-any */

import { mapbox } from './maps/mapbox';
import type { GeoRefData } from '$lib/georeference';
import { projectPointForGeoreference, latLngToLngLat } from '$lib/georeference';

export async function convertImageToGeoTiff(image: File, gpcs: string[]) {
  const loam = await import('loam');
  const file = await loam.open(image);

  const dataset = await file.convert(['-of', 'GTiff', '-a_srs', 'EPSG:4326', ...gpcs]);

  const compressionArgs = ['-co', 'COMPRESS=LZW', '-co', 'TILED=YES', '-co', 'PREDICTOR=2'];
  const warpedDataset = await dataset.warp(['-of', 'GTiff', '-t_srs', 'EPSG:3857', '-dstalpha', '-r', 'cubic', ...compressionArgs]);

  const fileBytes: Uint16Array = await warpedDataset.bytes();
  const filename = warpedDataset.source.src.name.split('.')[0] + '.tiff';

  return new File([fileBytes], filename, { type: 'image/tiff' });
}

export function setGeoRefData(width: number, height: number, sw: mapbox.LngLatLike, ne: mapbox.LngLatLike): GeoRefData {
  return {
    points: [
      // SW
      { x: 0, y: 0, longitude: sw[0], latitude: sw[1] },
      // NE
      { x: width, y: height, longitude: ne[0], latitude: ne[1] },
    ],
    bbox: [0, 0, width, height],
  };
}

export function getPositionInfo(georefData: GeoRefData): number[][] {
  return [
    latLngToLngLat(projectPointForGeoreference([georefData.bbox[0], georefData.bbox[3]], georefData)),
    latLngToLngLat(projectPointForGeoreference([georefData.bbox[2], georefData.bbox[3]], georefData)),
    latLngToLngLat(projectPointForGeoreference([georefData.bbox[2], georefData.bbox[1]], georefData)),
    latLngToLngLat(projectPointForGeoreference([georefData.bbox[0], georefData.bbox[1]], georefData)),
  ];
}

export function getBoundingboxFeatures(points: mapbox.LngLatLike[]): GeoJSON.FeatureCollection {
  const bounds = points.reduce((r, a) => r.extend(a), new mapbox.LngLatBounds(points[0], points[0]));
  const bboxP1 = [bounds.getWest(), bounds.getNorth()];
  const bboxP2 = [bounds.getEast(), bounds.getNorth()];
  const bboxP3 = [bounds.getEast(), bounds.getSouth()];
  const bboxP4 = [bounds.getWest(), bounds.getSouth()];

  return {
    type: 'FeatureCollection',
    features: [
      // NW (initial pos)
      {
        type: 'Feature',
        properties: { description: '1' },
        geometry: {
          type: 'Point',
          coordinates: bboxP1,
        },
      },
      {
        type: 'Feature',
        properties: { description: '2' },
        geometry: {
          type: 'Point',
          coordinates: bboxP2,
        },
      },
      {
        type: 'Feature',
        properties: { description: '3' },
        geometry: {
          type: 'Point',
          coordinates: bboxP3,
        },
      },
      {
        type: 'Feature',
        properties: { description: '4' },
        geometry: {
          type: 'Point',
          coordinates: bboxP4,
        },
      },
    ],
  };
}

export function getMarkersPosInfo(markerBL: mapbox.Marker, markerTR: mapbox.Marker, georefData: GeoRefData): number[][] {
  const { lng: lngBL, lat: latBL } = markerBL.getLngLat();
  const { lng: lngTR, lat: latTR } = markerTR.getLngLat();
  const newGeoRefData = {
    points: [
      {
        x: 0,
        y: 0,
        // SW
        longitude: lngBL,
        latitude: latBL,
      },
      {
        x: georefData.bbox[2], // width,
        y: georefData.bbox[3], // height,
        // NE
        longitude: lngTR,
        latitude: latTR,
      },
    ],
    bbox: georefData.bbox,
  };

  return getPositionInfo(newGeoRefData);
}

export function gcpsToFeatureCollection(
  upperLX: number,
  upperLY: number,
  upperRX: number,
  upperRY: number,
  lowerRX: number,
  lowerRY: number,
  lowerLX: number,
  lowerLY: number,
) {
  return {
    type: 'FeatureCollection',
    features: [
      // NW (initial pos)
      {
        type: 'Feature',
        properties: { description: '1' },
        geometry: {
          type: 'Point',
          coordinates: [+upperLX, +upperLY],
        },
      },
      // NE (initial pos)
      {
        type: 'Feature',
        properties: { description: '2' },
        geometry: {
          type: 'Point',
          coordinates: [+upperRX, +upperRY],
        },
      },
      // SE (initial pos)
      {
        type: 'Feature',
        properties: { description: '3' },
        geometry: {
          type: 'Point',
          coordinates: [+lowerRX, +lowerRY],
        },
      },
      // SW (initial pos)
      {
        type: 'Feature',
        properties: { description: '4' },
        geometry: {
          type: 'Point',
          coordinates: [+lowerLX, +lowerLY],
        },
      },
    ],
  };
}
