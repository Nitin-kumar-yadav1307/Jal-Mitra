const mongoose = require('mongoose');

const waterRequestSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  societyName: { type: String, required: true },
  area: { type: String, required: true },
  litersNeeded: { type: Number, required: true },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['critical', 'moderate', 'low'], default: 'moderate' },
  status: {
    type: String,
    enum: ['open', 'helper_found', 'in_transit', 'delivered'],
    default: 'open'
  },
  helperSociety: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  agreedCostSplit: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'settled'], default: 'pending' },
  transport: {
    vehicleNumber: { type: String, default: '' },
    driverName: { type: String, default: '' },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    },
    isTracking: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('WaterRequest', waterRequestSchema);