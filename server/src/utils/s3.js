const isWorker = typeof globalThis.caches !== 'undefined' && !(typeof process !== 'undefined' && process.release && process.release.name === 'node');

let s3Instance = null;

function getS3() {
  if (s3Instance) return s3Instance;
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3Instance = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true,
    });
  } catch (err) {
    console.warn('⚠️ S3 Client failed to initialize:', err.message);
  }
  return s3Instance;
}

const getBucketName = () => process.env.R2_BUCKET_NAME || 'boardless-trips';

/**
 * Returns a readable stream for an object in S3/R2
 * @param {string} key 
 */
function getObjectStream(key) {
  const passThrough = new (require('stream').PassThrough)();

  try {
    const s3 = getS3();
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    if (!s3) throw new Error('S3 Client is not initialized.');
    
    s3.send(new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })).then((response) => {
      if (response.Body && typeof response.Body.pipe === 'function') {
        response.Body.pipe(passThrough);
      } else if (response.Body) {
        const { Readable } = require('stream');
        if (typeof Readable.fromWeb === 'function') {
          Readable.fromWeb(response.Body).pipe(passThrough);
        } else {
          response.Body.transformToByteArray().then((byteArray) => {
            passThrough.write(Buffer.from(byteArray));
            passThrough.end();
          }).catch((err) => {
            passThrough.emit('error', err);
          });
        }
      } else {
        passThrough.emit('error', new Error('Empty response body from S3.'));
      }
    }).catch((err) => {
      passThrough.emit('error', err);
    });
  } catch (err) {
    passThrough.emit('error', err);
  }

  return passThrough;
}

/**
 * Deletes an object from S3/R2
 * @param {string} key 
 */
async function deleteObject(key) {
  try {
    const s3 = getS3();
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    if (!s3) throw new Error('S3 Client is not initialized.');

    await s3.send(new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }));
    return true;
  } catch (err) {
    console.error(`Failed to delete ${key} from R2:`, err);
    return false;
  }
}

module.exports = {
  getObjectStream,
  deleteObject,
};

Object.defineProperty(module.exports, 's3', {
  get: () => getS3(),
  configurable: true,
  enumerable: true
});

Object.defineProperty(module.exports, 'BUCKET_NAME', {
  get: () => getBucketName(),
  configurable: true,
  enumerable: true
});
