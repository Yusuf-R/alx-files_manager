/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
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
  res.status(201).json({
    id: data.insertedId,
    email,
  });
}

module.exports = {
  postNew,
};
