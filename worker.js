import Bull from 'bull';
import fs from 'fs';
import { promisify } from 'util';
import imgThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const { ObjectId } = require('mongodb');

const fileQueue = new Bull('fileQueue');
const writeFileAsync = promisify(fs.writeFile);

async function createThumbnail(filePath, width) {
  console.log(`Creating thumbnail for ${filePath}_${width}`);
  const thumbnail = await imgThumbnail(filePath, { width });
  return writeFileAsync(`${filePath}_${width}`, thumbnail);
}
fileQueue.process(async (job, done) => {
  const { fileId } = job.data;
  const { userId } = job.data;
  if (!fileId) {
    throw Error('Missing fileId');
  }
  if (!userId) {
    throw Error('Missing userId');
  }
  const files = await dbClient.filesCollection();
  const file = await files.findOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });
  if (!file) {
    throw Error('File not found');
  }
  const sizes = [100, 250, 500];
  const promises = sizes.map((size) => createThumbnail(file.localPath, size));
  await Promise.all(promises);
  done();
});
