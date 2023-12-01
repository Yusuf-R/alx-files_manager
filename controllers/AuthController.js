const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db').default;
const redisClient = require('../utils/redis').default;

// token key expiration 24hrs
const EXP = 60 * 60 * 24;

// GET /connect should sign-in the user by generating a new authentication token:
async function getConnect(req, res) {
  // check if req is coming with Auhorization header
  if (!req.headers.authorization) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  // check if Authorization header starts with Baic + space
  if (!req.headers.authorization.startsWith('Basic ')) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  // get the token
  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  // conver the token to object and check if the token is valid or not
  const result = await dbClient.checkUserToken(token);
  if (!result) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  // generate a new token
  const newToken = uuidv4();
  // create a key in redis with format auth_newToken
  const key = `auth_${newToken}`;

  // set the new token in redis with expiration 24hrs
  try {
    await redisClient.set(key, token, EXP);
  } catch (error) {
    res.status(500).json({
      error: 'Redis is not alive',
    });
    return;
  }
  // return the new token with a status code 200
  res.status(200).json({
    token: newToken,
  });
}

// GET /disconnect should sign-out the user based on the token:
async function getDisconnect(req, res) {
  // authenticated endpoints of our API will look at this token inside the header X-Token
  // retrive the user token, if not found raise 401
  const token = req.get('X-Token');
  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  // retriee the basicAuthToken from reids
  const key = `auth_${token}`;
  const basicAuthToken = await redisClient.get(key);
  if (!basicAuthToken) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  // retreive the user object base on the token
  const user = await dbClient.checkUserToken(basicAuthToken);
  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }
  // continue with sign-out logic
  // delete the user token in redis
  try {
    await redisClient.del(`auth_${token}`);
    res.sendStatus(204);
    return;
  } catch (error) {
    res.status(500).json({
      error: 'Redis is not alive',
    });
  }
}

module.exports = {
  getConnect,
  getDisconnect,
};
