/* eslint-disable no-unused-vars */
/* eslint-disable import/newline-after-import */

// asynchrouns fs module
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db').default;
const { userXToken } = require('./UsersController');
const acceptedType = ['folder', 'file', 'image'];

// altpath
const altPath = '/tmp/files_manager';
// database folder path
let fileDir = process.env.FOLDER_PATH;

if (!fileDir) {
  fileDir = altPath;
}
// check if the folder exists if not create it
async function ensureFolderPath(folderDir) {
  try {
    // Check if the folder exists
    await fs.access(folderDir);
    // Folder exists
  } catch (error) {
    // Folder doesn't exist, create it
    await fs.mkdir(folderDir, { recursive: true });
  }
}

async function postUpload(req, res) {
  const xToken = await req.get('X-Token');
  // get user object from the token in redis
  if (!xToken) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  const userObj = await userXToken(xToken);
  if (!userObj) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  // check for parentId and isPublic
  let { parentId } = req.body;
  if (!parentId) {
    parentId = 0;
  }
  let { isPublic } = req.body;
  if (!isPublic) {
    isPublic = false;
  }
  // check for the respective fields of the post request
  const { name, type } = req.body;
  if (!name) {
    res.status(400).json({
      error: 'Missing name',
    });
    return;
  }
  // check if the type is valid
  if (!type || !acceptedType.includes(type)) {
    res.status(400).json({
      error: 'Missing type',
    });
    return;
  }
  // if parentId is set
  if (parentId) {
    // check if the parent exists
    const result = await dbClient.getParent(parentId, userObj);
    if (!result) {
      res.status(400).json({
        error: 'Parent not found',
      });
      return;
    }
    // check in the result if the type is a folder
    if (result.type !== 'folder') {
      res.status(400).json({
        error: 'Parent is not a folder',
      });
      return;
    }
  }
  // we are now dealing with parentId = 0 and type = folder
  // create file obj in the db
  if (type === 'folder') {
    const fileObj = {
      userId: userObj._id,
      name,
      type,
      parentId,
      isPublic,
    };
    const newDoc = await dbClient.createNewDoc(fileObj);
    if (!newDoc) {
      res.sendStatus(501);
      return;
    }
    res.status(201).json(fileObj);
    return;
  }
  // else type is either file or image
  // set the filname as uuid
  const filename = uuidv4();
  // create the file path if not exits
  await ensureFolderPath(fileDir);
  // store this filename in this file path, thus combine the path
  // to be like /tmp/files_manager/uuid
  const filePath = path.join(fileDir, filename);
  const { data } = req.body;
  // check if the data is missing and type is not folder
  if (!data && type !== 'folder') {
    res.status(400).json({
      error: 'Missing data',
    });
    return;
  }
  // At this stage, file type is either file or image
  // thus write the data to the file as base64
  const data64 = Buffer.from(data, 'base64');
  try {
    await fs.writeFile(filePath, data64, 'utf-8');
    // store the filename in the database
    const obj = {
      userId: userObj._id,
      name,
      type,
      parentId,
      isPublic,
      localPath: filePath,
    };
    await dbClient.createNewDoc(obj);
    res.status(201).json(obj);
    return;
  } catch (error) {
    res.status(500).json({
      error: 'Failed to write data to file',
    });
    throw error;
  }
}

module.exports = {
  postUpload,
};
