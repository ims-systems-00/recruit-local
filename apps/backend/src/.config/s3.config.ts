import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET!,
  },
  region: process.env.AWS_REGION ?? "eu-west-2",
  followRegionRedirects: true,
});

export { s3Client };
