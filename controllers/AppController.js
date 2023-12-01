/* eslint-disable max-len */
const redisClient = require('../utils/redis').default;
const dbClient = require('../utils/db').default;
// GET /status
// should return if Redis is alive and if the DB is alive too by using the 2 utils created previously:
// it should return { "redis": true, "db": true } with a status code 200
function getStatus(req, res) {
  if (redisClient.isAlive() && dbClient.isAlive()) {
    res.status(200).json({
      redis: true,
      db: true,
    });
  } else {
    res.status(500).json({
      redis: false,
      db: false,
    });
  }
}
// GET /stats should return the number of users and files in DB:
// it should return { "users": 12, "files": 1231 } with a status code 200
// users collection must be used for counting all users
// files collection must be used for counting all files
async function getStats(req, res) {
  if (!redisClient.isAlive() || !dbClient.isAlive()) {
    res.status(500).json({
      redis: false,
      db: false,
    });
    return;
  }
  const users = await dbClient.nbUsers();
  const files = await dbClient.nbFiles();
  res.status(200).json({
    users,
    files,
  });
}

module.exports = {
  getStatus,
  getStats,
};
