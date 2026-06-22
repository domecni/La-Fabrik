import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { config } from 'dotenv'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { lookup } from 'mime-types'

config({ path: '.env.upload' })

const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error('Missing env vars. Check .env.upload')
  process.exit(1)
}

const client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const PUBLIC_DIR = join(fileURLToPath(import.meta.url), '../../public')
const FOLDERS_TO_UPLOAD = ['assets', 'cinematics', 'fonts', 'models', 'sounds', 'textures']

function walkDir(dir) {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walkDir(full) : [full]
  })
}

async function uploadFile(localPath) {
  const key = relative(PUBLIC_DIR, localPath).replace(/\\/g, '/')
  const body = readFileSync(localPath)
  const contentType = lookup(localPath) || 'application/octet-stream'
  await client.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: contentType }))
  console.log(`✓ ${key}`)
}

async function main() {
  const files = FOLDERS_TO_UPLOAD.flatMap(f => walkDir(join(PUBLIC_DIR, f)))
  console.log(`Uploading ${files.length} files to "${R2_BUCKET}"...`)
  for (let i = 0; i < files.length; i += 5) {
    await Promise.all(files.slice(i, i + 5).map(uploadFile))
    console.log(`Progress: ${Math.min(i + 5, files.length)}/${files.length}`)
  }
  console.log('Done.')
}

main()
