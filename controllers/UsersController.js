/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
// start a background processing for sending a “Welcome email” to the user
import Queue from 'bull';

const { default: redisClient } = require('../utils/redis');
const dbClient = require('../utils/db').default;

async function postNew(req, res) {
  // If the email is missing, return an error Missing email with a status code 400
  // If the password is missing, return an error Missing password with a status code 400
  const { email } = req.body;
  if (!email) {
    res.status(400).json({
      error: 'Missing email',
    });
    return;
  }
  const { password } = req.body;
  if (!password) {
    res.status(400).json({
      error: 'Missing password',
    });
    return;
  }
  // If the email already exists in DB, return an error Already exist with a status code 400
  if (!dbClient.isAlive()) {
    res.status(500).json({
      error: 'Redis is not alive',
    });
  }
  const result = await dbClient.checkUser(email);
  if (result) {
    res.status(400).json({
      error: 'Already exist',
    });
    return;
  }
  // Else, create the user in DB with the email and password provided
  // Return the creation of the user with a status code 201
  const data = await dbClient.addUser(email, password);
  if (!data) {
    res.status(500).json({
      error: 'Error creating user',
    });
    return;
  }
  // create a background process
  const userQueue = new Queue('userQueue');
  const jobData = {
    userId: data.insertedId.toString(),
  };
  userQueue.add(jobData);
  res.status(201).json({
    id: data.insertedId,
    email,
  });
}

async function userXToken(token) {
  // get user object from the token in redis
  const key = `auth_${token}`;
  const userID = await redisClient.get(key);
  if (!userID) {
    return null;
  }
  const userObj = await dbClient.getUser(userID);
  if (!userObj) {
    return null;
  }
  return userObj;
}

async function getMe(req, res) {
  // extract the token from the header X-Token
  const token = req.get('X-Token');
  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  const userObj = await userXToken(token);
  if (!userObj) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  res.status(200).json({
    id: userObj._id,
    email: userObj.email,
  });
}

module.exports = {
  postNew,
  getMe,
  userXToken,
};
