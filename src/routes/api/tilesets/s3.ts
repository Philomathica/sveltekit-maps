import { mapbox } from '$lib/variables';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { RequestHandler } from '@sveltejs/kit';

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
