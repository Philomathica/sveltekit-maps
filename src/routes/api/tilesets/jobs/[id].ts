import { mapbox } from '$lib/variables';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Get upload status from mapbox geotiff to tileset conversion
 */
export const get: RequestHandler = async ({ params }) => {
  const url = `${mapbox.baseUploadUrl}/${params.id}?access_token=${mapbox.uploadToken}`;
  const response = await fetch(url);

  return { status: 200, body: await response.json() };
};