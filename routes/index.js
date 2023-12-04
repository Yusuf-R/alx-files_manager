/* eslint-disable object-curly-newline */

// create the Express server:
const express = require('express');
// router are used to separate the routes from the main server file
const router = express.Router();

const { getStatus, getStats } = require('../controllers/AppController');
const { postNew, getMe } = require('../controllers/UsersController');
const { getConnect, getDisconnect } = require('../controllers/AuthController');
const { postUpload, getShow, getIndex } = require('../controllers/FilesController');
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

// POST /files => FilesController.postUpload
router.post('/files', postUpload);

// GET /files => FilesController.getFiles
router.get('/files/:id', getShow);

// GET /files => FilesController.getIndex
router.get('/files', getIndex);

module.exports = router;
