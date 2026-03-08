const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getGlobalMessages,
  getRequestMessages
} = require('../controllers/messagesController');

router.use((req, res, next) => {
  req.io = req.app.get('io');
  next();
});

router.post('/', protect, sendMessage);
router.get('/', protect, getGlobalMessages);
router.get('/:requestId', protect, getRequestMessages);

module.exports = router;