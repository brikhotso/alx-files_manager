import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import { dbClient } from '../utils/db';
import fs from 'fs';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.client.db().collection('files').findOne({
    _id: ObjectId(fileId),
    userId,
  });
  if (!file) {
    throw new Error('File not found');
  }

  const thumbnailSizes = [500, 250, 100];
  const thumbnailPromises = thumbnailSizes.map(async (size) => {
    const thumbnailPath = `${file.localPath}_${size}`;
    const thumbnail = await imageThumbnail(file.localPath, { width: size });
    await fs.promises.writeFile(thumbnailPath, thumbnail);
  });
  await Promise.all(thumbnailPromises);
});

const userQueue = new Queue('userQueue');

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  
  const user = await dbClient.client.db().collection('users').findOne({
    _id: ObjectId(userId),
  });
  if (!user) {
    throw new Error('User not found');
  }

  console.log(`Welcome ${user.email}!`);
});
