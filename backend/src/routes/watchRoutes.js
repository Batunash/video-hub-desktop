const express = require('express');
const router = express.Router();
const watchController = require('../controllers/watchController');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

router.get('/stream/:episodeId', optionalAuth, watchController.startWatch);
router.put('/episode/:episodeId/progress', authenticateToken, watchController.updateProgress);

module.exports = router;