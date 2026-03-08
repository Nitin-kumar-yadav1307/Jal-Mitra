const WaterRequest = require('../models/WaterRequest');

const createRequest = async (req, res) => {
  try {
    const { litersNeeded, description, urgency, agreedCostSplit } = req.body;

    const request = await WaterRequest.create({
      postedBy: req.user._id,
      societyName: req.user.societyName,
      area: req.user.area,
      litersNeeded,
      description,
      urgency,
      agreedCostSplit: agreedCostSplit || 0
    });

    const populated = await request.populate('postedBy', 'name societyName area phone');
    req.io.emit('request:updated', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const requests = await WaterRequest.find()
      .populate('postedBy', 'name societyName area phone')
      .populate('helperSociety', 'name societyName area phone')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const request = await WaterRequest.findById(req.params.id)
      .populate('postedBy', 'name societyName area phone')
      .populate('helperSociety', 'name societyName area phone');

    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const offerHelp = async (req, res) => {
  try {
    const request = await WaterRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'open') {
      return res.status(400).json({ message: 'Request already has a helper' });
    }

    if (request.postedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot help your own request' });
    }

    request.helperSociety = req.user._id;
    request.status = 'helper_found';
    await request.save();

    const populated = await request.populate([
      { path: 'postedBy', select: 'name societyName area phone' },
      { path: 'helperSociety', select: 'name societyName area phone' }
    ]);

    req.io.emit('request:updated', populated);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const startTransit = async (req, res) => {
  try {
    const { vehicleNumber, driverName } = req.body;
    const request = await WaterRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.helperSociety.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the helper can start transit' });
    }

    request.transport.vehicleNumber = vehicleNumber;
    request.transport.driverName = driverName;
    request.transport.isTracking = true;
    request.status = 'in_transit';
    await request.save();

    const populated = await request.populate([
      { path: 'postedBy', select: 'name societyName area phone' },
      { path: 'helperSociety', select: 'name societyName area phone' }
    ]);

    req.io.emit('request:updated', populated);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const request = await WaterRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.transport.currentLocation = { lat, lng };
    await request.save();

    req.io.emit('location:update', {
      requestId: req.params.id,
      lat,
      lng
    });

    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markDelivered = async (req, res) => {
  try {
    const request = await WaterRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'delivered';
    request.transport.isTracking = false;
    await request.save();

    const populated = await request.populate([
      { path: 'postedBy', select: 'name societyName area phone' },
      { path: 'helperSociety', select: 'name societyName area phone' }
    ]);

    req.io.emit('request:updated', populated);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  offerHelp,
  startTransit,
  updateLocation,
  markDelivered
};