import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { mapbox } from '$lib/variables';
import type { RequestHandler } from '@sveltejs/kit';
import { customAlphabet } from 'nanoid';
import * as nanoidDictionary from 'nanoid-dictionary';
import type { Locals } from '$lib/types';

/**
 * Get the mapbox s3 bucket to upload image and signed url so the client can upload image directly.
 */
export const get: RequestHandler = async () => {
  const url = `${mapbox.baseUploadUrl}/credentials?access_token=${mapbox.uploadToken}`;
  const response = await fetch(url, { method: 'POST' });
  const { accessKeyId, secretAccessKey, sessionToken, bucket: Bucket, key: Key, url: fileUrl } = await response.json();
  const command = new PutObjectCommand({ Bucket, Key });
  const s3Client = new S3Client({ region: 'us-east-1', credentials: { accessKeyId, secretAccessKey, sessionToken } });
  const signedUrl = await getSignedUrl(s3Client, command);

  return { status: 200, body: { signedUrl, fileUrl } };
};

/**
 * Convert client uploaded s3 image to mapbox tileset.
 */
export const post: RequestHandler<Locals, string> = async ({ body }) => {
  const nanoid = customAlphabet(nanoidDictionary.alphanumeric, 6);
  const tileset = `${mapbox.username}.${nanoid()}`;
  const { fileUrl, name } = JSON.parse(body);
  const url = `${mapbox.baseUploadUrl}?access_token=${mapbox.uploadToken}`;
  const payload = JSON.stringify({ url: fileUrl, tileset, name });
  const response = await fetch(url, { body: payload, method: 'POST', headers: { 'Content-Type': 'application/json' } });
  const result = await response.json();

  if (!response.ok) {
    console.error('error converting image:', result.message);

    return { status: 500, body: result };
  }

  // if (locals.tileset) {
  //   fetch(`${mapbox.baseTilesetUrl}/${locals.tileset}?access_token=${mapbox.uploadToken}`, { method: 'DELETE' });
  // }

  return {
    status: 200,
    body: result,
  };
};
