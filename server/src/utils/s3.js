const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'boardless-trips';

/**
 * Returns a readable stream for an object in S3/R2
 * @param {string} key 
 */
function getObjectStream(key) {
  const passThrough = new (require('stream').PassThrough)();
  
  s3.send(new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })).then((response) => {
    response.Body.pipe(passThrough);
  }).catch((err) => {
    passThrough.emit('error', err);
  });

  return passThrough;
}

/**
 * Deletes an object from S3/R2
 * @param {string} key 
 */
async function deleteObject(key) {
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));
    return true;
  } catch (err) {
    console.error(`Failed to delete ${key} from R2:`, err);
    return false;
  }
}

module.exports = {
  s3,
  BUCKET_NAME,
  getObjectStream,
  deleteObject,
};
