export function convertFileToImage(image: File, callback: (image: HTMLImageElement) => void) {
  const reader = new FileReader();
  reader.readAsDataURL(image);
  reader.onload = (event: ProgressEvent<FileReader>) => {
    const img = new Image();
    img.src = event.target.result as string;
    img.onload = () => callback(img);
  };
}

export async function convertImageToGeoTiff(image: File, gcps: string[]) {
  const loam = await import('loam');
  loam.initialize(window.location.origin);

  const file = await loam.open(image);
  const dataset = await file.convert(['-of', 'GTiff', '-a_srs', 'EPSG:4326', ...gcps]);

  const compressionArgs = ['-co', 'COMPRESS=LZW', '-co', 'TILED=YES', '-co', 'PREDICTOR=2'];
  const srcAlpha = image.type === 'image/png' ? ['-srcalpha'] : [];
  const warpedDataset = await dataset.warp(['-of', 'GTiff', '-t_srs', 'EPSG:3857', '-dstalpha',  '-r', 'bilinear', ...compressionArgs, ...srcAlpha]);

  const fileBytes: Uint16Array = await warpedDataset.bytes();
  const filename = warpedDataset.source.src.name.split('.')[0] + '.tiff';

  return new File([fileBytes], filename, { type: 'image/tiff' });
}
