import { mapbox } from '$lib/variables';
import type { RequestHandler } from '@sveltejs/kit';
import { customAlphabet } from 'nanoid';
import nanoidDictionary from 'nanoid-dictionary';
import type { Locals } from '$lib/types';

/**
 * Convert client uploaded s3 image to mapbox tileset.
 */
export const post: RequestHandler<Locals, string> = async ({ params, body }) => {
  const nanoid = customAlphabet(nanoidDictionary.alphanumeric, 6);
  const tileset = `${mapbox.username}.${nanoid()}`;
  const { fileUrl, name } = JSON.parse(body);
  const url = `${mapbox.baseUploadUrl}?access_token=${mapbox.uploadToken}`;
  const payload = JSON.stringify({ url: fileUrl, tileset, name });
  const response = await fetch(url, { body: payload, method: 'POST', headers: { 'Content-Type': 'application/json' } });
  const result = await response.json();

  if (!response.ok) {
    console.error('error converting image:', result.message);

    return { status: response.status, body: result };
  }

  // only delete when there is an existing tileset
  if (params.id && params.id !== 'new') {
    const response = await fetch(`${mapbox.baseTilesetUrl}/${params.id}?access_token=${mapbox.uploadToken}`, { method: 'DELETE' });
    const result = await response.json();

    if (!response.ok) {
      console.error('error deleting tileset:', result);

      return { status: response.status, body: result };
    }
  }

  return {
    body: result,
  };
};
