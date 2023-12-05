/* eslint-disable no-useless-return */
/* eslint-disable no-unused-vars */
/* eslint-disable import/newline-after-import */

// asynchrouns fs module
const fs = require('fs').promises;
const mime = require('mime-types');
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

// helper function to get the user from the token
async function userToken(xtoken) {
  if (!xtoken) {
    return null;
  }
  const usrObj = await userXToken(xtoken);
  if (!usrObj) {
    return null;
  }
  return usrObj;
}

async function postUpload(req, res) {
  const xToken = await req.get('X-Token');
  // get user object from the token in redis
  const userObj = await userToken(xToken);
  if (!userObj) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  // check for parentId and isPublic
  let { parentId } = await req.body;
  if (!parentId) {
    parentId = 0;
  }
  let { isPublic } = await req.body;
  if (!isPublic) {
    isPublic = false;
  }
  // check for the respective fields of the post request
  const { name, type } = await req.body;
  console.log(name);
  console.log(type);
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
    console.log(userObj._id);
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
    res.status(201).json({
      id: newDoc.insertedId,
      name,
      type,
      isPublic,
      parentId,
      userId: userObj._id,
    });
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
  const { data } = await req.body;
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
    const result = await dbClient.createNewDoc(obj);
    res.status(201).json({
      id: result.insertedId,
      name,
      type,
      isPublic,
      parentId,
      userId: userObj._id,
    });
    return;
  } catch (error) {
    res.status(500).json({
      error: 'Failed to write data to file',
    });
    throw error;
  }
  // update the endpoint to start a background processing
}

// get the document base on the id
async function getShow(req, res) {
  // validate the user from the token
  const xToken = await req.get('X-Token');
  const userObj = await userToken(xToken);
  if (!userObj) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  const { id } = await req.params;
  //
  if (!id) {
    res.status(400).json({
      error: 'Missing id',
    });
    return;
  }
  // get the user object from the db base on the id and userId
  const result = await dbClient.getParent(id, userObj);
  if (!result) {
    res.status(404).json({
      error: 'Not found',
    });
    return;
  }
  res.status(200).json({
    id: result._id,
    name: result.name,
    type: result.type,
    isPublic: result.isPublic,
    parentId: result.parentId,
    userId: result.userId,
  });
  return;
}

async function getIndex(req, res) {
  // validate the user from the token
  const xToken = await req.get('X-Token');
  const userObj = await userToken(xToken);
  const itemsPerPage = 20;
  if (!userObj) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  // get the parentId from the query
  let { parentId } = await req.query;
  if (!parentId) {
    parentId = 0;
  }
  if (typeof parentId === 'string' && parentId === '0') {
    parentId = parseInt(parentId, 10);
  }
  let { page } = await req.query;
  if (!page) {
    page = 0;
  }
  if (typeof page === 'string') {
    parentId = parseInt(parentId, 10);
  }
  // check if the parent exists
  const skip = page * itemsPerPage;
  const limit = itemsPerPage;
  if (parentId === 0 || typeof parentId === 'string') {
    // get the parent object from the db base on the id and userId
    // using pagination
    const result = await dbClient.getPaginateOutput(parentId, userObj, skip, limit);
    if (!result) {
      res.status(404).json([]);
      return;
    }
    // result is valid,
    // return the list of files
    const files = [];
    result.forEach((file) => {
      files.push({
        id: file._id,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
        userId: file.userId,
      });
    });
    res.status(200).json(files);
    return;
  }
  res.status(404).json([]);
  return;
}

async function putPublish(req, res) {
  // extract the token and verify it
  const xToken = await req.get('X-Token');
  const userObj = await userToken(xToken);
  if (!userObj) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  const { id } = await req.params;
  if (!id) {
    res.status(400).json({
      error: 'Missing id',
    });
    return;
  }
  // get the user object from the db base on the id and userId
  const result = await dbClient.getParent(id, userObj);
  if (!result) {
    res.status(404).json({
      error: 'Not found',
    });
    return;
  }
  // update the isPublic to true
  const obj = {
    isPublic: true,
  };
  const updateResult = await dbClient.isPublicUpdate(id, obj);
  if (!updateResult) {
    res.status(404).json({
      error: 'Not found',
    });
    return;
  }
  const update = await dbClient.getParent(id, userObj);
  res.status(200).json({
    id: update._id,
    name: update.name,
    type: update.type,
    isPublic: update.isPublic,
    parentId: update.parentId,
    userId: update.userId,
  });
  return;
}

async function putUnpublish(req, res) {
  // extract the token and verify it
  const xToken = await req.get('X-Token');
  const userObj = await userToken(xToken);
  if (!userObj) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  const { id } = await req.params;
  if (!id) {
    res.status(400).json({
      error: 'Missing id',
    });
    return;
  }
  // get the user object from the db base on the id and userId
  const result = await dbClient.getParent(id, userObj);
  if (!result) {
    res.status(404).json({
      error: 'Not found',
    });
    return;
  }
  // update the isPublic to true
  const obj = {
    isPublic: false,
  };
  const updateResult = await dbClient.unPublishUpdate(id, obj);
  if (!updateResult) {
    res.status(404).json({
      error: 'Not found',
    });
    return;
  }
  const update = await dbClient.getParent(id, userObj);
  res.status(200).json({
    id: update._id,
    name: update.name,
    type: update.type,
    isPublic: update.isPublic,
    parentId: update.parentId,
    userId: update.userId,
  });
  return;
}

async function getFile(req, res) {
  // extract the token and verify it
  const xToken = await req.get('X-Token');
  const userObj = await userToken(xToken);
  if (!userObj) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  const { id } = await req.params;
  if (!id || id.length === 0 || id.length !== 24) {
    res.status(400).json({
      error: 'Missing id',
    });
    return;
  }
  // check if the id is linked to the file.
  const fileObj = await dbClient.checkFileObj(id);
  if (!fileObj) {
    res.status(404).json({
      error: 'Not found',
    });
    return;
  }
  // check for the authorization fo this file
  // it will involve cross checking the userObj._id and the file_userId
  if (fileObj.userId.toString() !== userObj._id.toString()) {
    res.status(404).json({
      error: 'Not found',
    });
    return;
  }

  // Check file type and isPublic for both file and folder
  if ((fileObj.type === 'file' || fileObj.type === 'folder') && fileObj.isPublic === false) {
    res.status(404).json({
      error: 'Not found',
    });
    return;
  }
  // check if the file type is a folder
  if (fileObj.type === 'folder') {
    res.status(400).json({
      error: 'A folder doesn\'t have content',
    });
    return;
  }
  // Construct the full file path
  const filePath = fileObj.localPath;
  try {
    await fs.access(filePath);
  } catch (err) {
    res.status(404).json({
      error: 'Not found',
    });
    return;
  }
  // Get the MIME-type based on the name of the file
  const mimeType = mime.lookup(fileObj.name);
  res.setHeader('Content-Type', mimeType);
  // return the content of the file with the correct MIME-type
  res.sendFile(filePath);
}

module.exports = {
  postUpload,
  getShow,
  getIndex,
  putPublish,
  putUnpublish,
  getFile,
};
