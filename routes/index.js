// 8.4 Write the routes
const express = require('express');
// router are used to separate the routes from the main server file
const router = express.Router();

const { getStatus, getStats } = require('../controllers/AppController');
const { postNew } = require('../controllers/UsersController');

// GET /status => AppController.getStatus
router.get('/status', getStatus);

// GET /stats => AppController.getStats
router.get('/stats', getStats);

// POST create a new user => UsersController.postNew
router.post('/users', postNew);

module.exports = router;
