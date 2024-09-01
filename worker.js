import { Queue } from 'bull';
import imageThumbnail from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import { dbClient } from '../utils/db';

const fileQueue = new Queue('file generation');

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
