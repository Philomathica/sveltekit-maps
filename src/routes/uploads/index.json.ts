import { variables } from '$lib/variables';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Get upload status
 */
export const post: RequestHandler<Record<string, unknown>, string> = async ({ body }) => {
  try {
    const { uploadId } = JSON.parse(body);
    const url = `https://api.mapbox.com/uploads/v1/luukmoret/${uploadId}?access_token=${variables.mapboxUploadToken}`;
    const response = await fetch(url);

    return { status: 200, body: await response.json() };
  } catch (error) {
    console.error(error);

    return { status: 500, body: { error: 'Error' } };
  }
};
