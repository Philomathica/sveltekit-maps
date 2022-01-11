export function convertFileToImage(image: File) {
  const promise = new Promise<HTMLImageElement>(resolve => {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      const img = new Image();

      img.onload = () => {
        resolve(img);
      };

      if (event.target) {
        img.src = event.target.result as string;
      }
    };

    reader.readAsDataURL(image);
  });

  return promise;
}

export async function convertImageToGeoTiff(image: File, gcps: string[]) {
  const loam = await import('loam');
  loam.initialize(window.location.origin);

  const file = await loam.open(image);
  const dataset = await file.convert(['-of', 'GTiff', '-a_srs', 'EPSG:4326', ...gcps]);

  const compressionArgs = ['-co', 'COMPRESS=LZW', '-co', 'TILED=YES', '-co', 'PREDICTOR=2'];
  const srcAlpha = image.type === 'image/png' ? ['-srcalpha'] : [];
  const warpedDataset = await dataset.warp(['-of', 'GTiff', '-t_srs', 'EPSG:3857', '-dstalpha', '-r', 'bilinear', ...compressionArgs, ...srcAlpha]);

  const fileBytes: Uint16Array = await warpedDataset.bytes();
  const filename = warpedDataset.source.src.name.split('.')[0] + '.tiff';

  return new File([fileBytes], filename, { type: 'image/tiff' });
}

export function sourceCoordinatesToGcpArr(sourceCoordinates: number[][], bbox: number[]): string[] {
  return [
    '-gcp',
    '0',
    '0',
    sourceCoordinates[0][0].toString(),
    sourceCoordinates[0][1].toString(),
    '-gcp',
    bbox[2].toString(),
    '0',
    sourceCoordinates[1][0].toString(),
    sourceCoordinates[1][1].toString(),
    '-gcp',
    bbox[2].toString(),
    bbox[3].toString(),
    sourceCoordinates[2][0].toString(),
    sourceCoordinates[2][1].toString(),
    '-gcp',
    '0',
    bbox[3].toString(),
    sourceCoordinates[3][0].toString(),
    sourceCoordinates[3][1].toString(),
  ];
}
