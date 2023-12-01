/* eslint-disable object-curly-newline */

// create the Express server:
const express = require('express');
// router are used to separate the routes from the main server file
const router = express.Router();

const { getStatus, getStats } = require('../controllers/AppController');
const { postNew, getMe } = require('../controllers/UsersController');
const { getConnect, getDisconnect } = require('../controllers/AuthController');
// GET /status => AppController.getStatus
router.get('/status', getStatus);

// GET /stats => AppController.getStats
router.get('/stats', getStats);

// POST create a new user => UsersController.postNew
router.post('/users', postNew);

// GET /connect => AuthController.getConnect
router.get('/connect', getConnect);

// GET /disconnect => AuthController.getDisconnect
router.get('/disconnect', getDisconnect);

// GET /users/me => UserController.getMe
router.get('/users/me', getMe);

module.exports = router;
