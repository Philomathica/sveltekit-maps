/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Marker } from 'mapbox-gl';
import type { GeoRefData } from './georeference';

// export async function getBoundingboxFeatures(points: LngLatLike[]): Promise<GeoJSON.FeatureCollection> {
//   const mapbox = await getMapbox();
//   const bounds = points.reduce((r, a) => r.extend(a), new mapbox.LngLatBounds(points[0], points[0]));
//   const bboxP1 = [bounds.getWest(), bounds.getNorth()];
//   const bboxP2 = [bounds.getEast(), bounds.getNorth()];
//   const bboxP3 = [bounds.getEast(), bounds.getSouth()];
//   const bboxP4 = [bounds.getWest(), bounds.getSouth()];

//   return {
//     type: 'FeatureCollection',
//     features: [
//       // NW (initial pos)
//       { type: 'Feature', properties: { description: '1' }, geometry: { type: 'Point', coordinates: bboxP1 } },
//       { type: 'Feature', properties: { description: '2' }, geometry: { type: 'Point', coordinates: bboxP2 } },
//       { type: 'Feature', properties: { description: '3' }, geometry: { type: 'Point', coordinates: bboxP3 } },
//       { type: 'Feature', properties: { description: '4' }, geometry: { type: 'Point', coordinates: bboxP4 } },
//     ],
//   };
// }

export function updateGeoRefDataByMarkers(markerSW: Marker, markerNE: Marker, georefData: GeoRefData): GeoRefData {
  // *****(NE)!
  // *        *
  // *        *
  // !(SW)*****

  const { lng: lngSW, lat: latSW } = markerSW.getLngLat();
  const { lng: lngNE, lat: latNE } = markerNE.getLngLat();
  return {
    points: [
      {
        x: 0, // width
        y: 0, // height,
        longitude: lngSW,
        latitude: latSW,
      }, // SW
      {
        x: georefData.bbox[2], // width,
        y: georefData.bbox[3], // height,
        longitude: lngNE,
        latitude: latNE,
      }, // NE
    ],
    bbox: georefData.bbox,
  };
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
      { type: 'Feature', properties: { description: '1' }, geometry: { type: 'Point', coordinates: [+upperLX, +upperLY] } }, // NW (initial pos)
      { type: 'Feature', properties: { description: '2' }, geometry: { type: 'Point', coordinates: [+upperRX, +upperRY] } }, // NE (initial pos)
      { type: 'Feature', properties: { description: '3' }, geometry: { type: 'Point', coordinates: [+lowerRX, +lowerRY] } }, // SE (initial pos)
      { type: 'Feature', properties: { description: '4' }, geometry: { type: 'Point', coordinates: [+lowerLX, +lowerLY] } }, // SW (initial pos)
    ],
  };
}
