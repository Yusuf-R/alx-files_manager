// By using the module Bull, create a queue fileQueue
import Queue from 'bull';

const imageThumbnail = require('image-thumbnail');
const fs = require('fs').promises;
const dbClient = require('./utils/db').default;

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');
const thumbnailWidth = ['500', '250', '100'];

// In here we now process the job that has been added to the queue
// If fileId is not present in the job, raise an error Missing fileId
fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;
  if (!fileId) {
    done(new Error('Missing fileId'));
    return;
  }
  if (!userId) {
    console.log('Missing userId');
    done(new Error('Missing userId'));
    return;
  }
  // If no document is found in DB based on the fileId and userId, raise an error File not found
  const document = await dbClient.getDocument(fileId, userId);
  if (!document) {
    done(new Error('File not found'));
    return;
  }
  // If document is found, check if the document is a folder
  if (document.type === 'folder') {
    done(new Error('File is a folder'));
  }
  // get the dir location of the fileobject
  const { localPath } = document;
  // By using the module image-thumbnail, generate 3 thumbnails with width = 500, 250 and 100 -
  // store each result on the same location of the original file by appending _<width size>
  // to the original filename
  thumbnailWidth.forEach(async (width) => {
    try {
      const thumbnail = await imageThumbnail(localPath, { width });
      const thumbPath = `${localPath}_${width}`;
      await fs.writeFile(thumbPath, thumbnail);
    } catch (error) {
      console.error(error.message);
    }
  });
  done();
});

// setting up userQueue
userQueue.process(async (job, done) => {
  const { userId } = job.data;
  if (!userId) {
    done(new Error('Missing userId'));
    return;
  }
  const user = await dbClient.getUser(userId);
  if (!user) {
    done(new Error('User not found'));
    return;
  }
  // after all validation print to the console to welcome the User
  console.log(`Welcome ${user.email}!`);
  done();
});

/** leave the logs alone for now
// logs on completion of the job
// Listen for completed jobs
fileQueue.on('completed', (job) => {
  console.log(`Job with fileID: ${job.data.fileId} completed`);
});

// logs on failure of the job
// Listen for failed jobs
fileQueue.on('failed', (job, err) => {
  console.log(`Job with fileID: ${job.data.fileId} failed: ${err.message}`);
});

// logs ofr userQueue
// logs for userQueue
userQueue.on('completed', (job) => {
  console.log(`Job with userId: ${job.data.userId} completed`);
});

// logs on failure of the job
// Listen for failed jobs
userQueue.on('failed', (job, err) => {
  console.log(`Job with userId: ${job.data.userId} failed: ${err.message}`);
});

*/
