import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";
import { mkdirSync, createWriteStream, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";

config({ path: ".env.upload" });

const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
  process.env;
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error("Missing env vars. Check .env.upload");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const PUBLIC_DIR = join(fileURLToPath(import.meta.url), "../../public");

async function listAllKeys() {
  const keys = [];
  let token;
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: R2_BUCKET, ContinuationToken: token }),
    );
    for (const obj of res.Contents ?? []) keys.push(obj.Key);
    token = res.NextContinuationToken;
  } while (token);
  return keys;
}

async function downloadFile(key) {
  const localPath = join(PUBLIC_DIR, key);
  mkdirSync(dirname(localPath), { recursive: true });
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    );
    await pipeline(res.Body, createWriteStream(localPath));
    console.log(`✓ ${key}`);
  } catch (err) {
    console.error(`✗ ${key} — ${err.message}`);
  }
}

async function main() {
  console.log("Listing objects...");
  const keys = await listAllKeys();
  console.log(`Downloading ${keys.length} files to public/...`);
  for (let i = 0; i < keys.length; i += 5) {
    await Promise.all(keys.slice(i, i + 5).map(downloadFile));
    console.log(`Progress: ${Math.min(i + 5, keys.length)}/${keys.length}`);
  }
  console.log("Done.");
}

main();
