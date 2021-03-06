import { mapbox } from '$lib/variables';
import type { RequestHandler } from '@sveltejs/kit';
import { customAlphabet } from 'nanoid';
import nanoidDictionary from 'nanoid-dictionary';
import type { MapboxJobStatus, Typify } from '$lib/types';

/**
 * Convert client uploaded s3 image to mapbox tileset.
 */
export const post: RequestHandler<Typify<MapboxJobStatus>> = async ({ params, request }) => {
  const nanoid = customAlphabet(nanoidDictionary.alphanumeric, 6);
  const tileset = `${mapbox.username}.${nanoid()}`;
  const { fileUrl, name }: { fileUrl: string; name: string } = await request.json();
  const url = `${mapbox.baseUploadUrl}?access_token=${mapbox.uploadToken}`;
  const payload = JSON.stringify({ url: fileUrl, tileset, name });
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: payload,
  });
  const result: MapboxJobStatus = await response.json();

  if (!response.ok) {
    console.error('error converting image:', result.error);

    return { status: response.status, body: result };
  }

  // only delete when there is an existing tileset
  if (params.tilesetId && params.tilesetId !== 'new') {
    const response = await fetch(`${mapbox.baseTilesetUrl}/${params.tilesetId}?access_token=${mapbox.uploadToken}`, { method: 'DELETE' });
    const result = await response.json();

    if (!response.ok) {
      console.error('error deleting tileset:', result);
    }
  }

  return {
    body: result,
  };
};
