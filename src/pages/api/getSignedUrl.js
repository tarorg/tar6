import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET({ request }) {
  console.log('getSignedUrl endpoint hit');
  try {
    const url = new URL(request.url);
    const fileName = url.searchParams.get('fileName');
    const fileType = url.searchParams.get('fileType');

    console.log('fileName:', fileName);
    console.log('fileType:', fileType);

    if (!fileName || !fileType) {
      return new Response(JSON.stringify({ error: 'Missing fileName or fileType' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log environment variables (be careful not to log sensitive information in production)
    console.log('R2_REGION:', import.meta.env.R2_REGION);
    console.log('R2_ENDPOINT:', import.meta.env.R2_ENDPOINT);
    console.log('R2_BUCKET_NAME:', import.meta.env.R2_BUCKET_NAME);

    const s3Client = new S3Client({
      region: import.meta.env.R2_REGION,
      endpoint: import.meta.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: import.meta.env.R2_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
      },
    });

    console.log('S3 client created');

    const command = new PutObjectCommand({
      Bucket: import.meta.env.R2_BUCKET_NAME,
      Key: fileName,
      ContentType: fileType,
    });

    console.log('PutObjectCommand created');

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    console.log('Signed URL generated:', signedUrl);

    return new Response(JSON.stringify({ signedUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate signed URL', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
