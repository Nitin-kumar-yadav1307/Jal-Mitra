const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createRequest,
  getAllRequests,
  getRequestById,
  offerHelp,
  startTransit,
  updateLocation,
  markDelivered
} = require('../controllers/requestsController');

// Attach io to req
router.use((req, res, next) => {
  req.io = req.app.get('io');
  next();
});

router.post('/', protect, createRequest);
router.get('/', protect, getAllRequests);
router.get('/:id', protect, getRequestById);
router.patch('/:id/help', protect, offerHelp);
router.patch('/:id/transit', protect, startTransit);
router.patch('/:id/location', protect, updateLocation);
router.patch('/:id/delivered', protect, markDelivered);

module.exports = router;