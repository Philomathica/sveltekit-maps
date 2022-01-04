export async function convertImageToGeoTiff(image: File, gcps: string[]) {
  const loam = await import('loam');
  const file = await loam.open(image);
  const dataset = await file.convert(['-of', 'GTiff', '-a_srs', 'EPSG:4326', ...gcps]);

  const compressionArgs = ['-co', 'COMPRESS=LZW', '-co', 'TILED=YES', '-co', 'PREDICTOR=2'];
  const warpedDataset = await dataset.warp(['-of', 'GTiff', '-t_srs', 'EPSG:3857', '-dstalpha', '-r', 'cubic', ...compressionArgs]);

  const fileBytes: Uint16Array = await warpedDataset.bytes();
  const filename = warpedDataset.source.src.name.split('.')[0] + '.tiff';

  return new File([fileBytes], filename, { type: 'image/tiff' });
}
