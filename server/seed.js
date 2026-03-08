const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User.js');
const WaterRequest = require('./models/WaterRequest');
const Message = require('./models/Message');

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Clear existing data
  await User.deleteMany();
  await WaterRequest.deleteMany();
  await Message.deleteMany();

  // Create users
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@jalmitra.com',
    password: 'admin123',
    phone: '9999999999',
    role: 'admin',
    societyName: 'Jal Mitra HQ',
    area: 'Mira Road East'
  });

  const rep1 = await User.create({
    name: 'Rahul Sharma',
    email: 'rahul@gmail.com',
    password: 'password123',
    phone: '9876543210',
    societyName: 'Shanti Nagar CHS',
    area: 'Mira Road East',
    location: { lat: 19.2952, lng: 72.8544 }
  });

  const rep2 = await User.create({
    name: 'Priya Mehta',
    email: 'priya@gmail.com',
    password: 'password123',
    phone: '9876543211',
    societyName: 'Sai Krupa Society',
    area: 'Bhayandar West',
    location: { lat: 19.3000, lng: 72.8450 }
  });

  const rep3 = await User.create({
    name: 'Amit Patil',
    email: 'amit@gmail.com',
    password: 'password123',
    phone: '9876543212',
    societyName: 'Ganesh Apartments',
    area: 'Mira Road West',
    location: { lat: 19.2850, lng: 72.8600 }
  });

  const rep4 = await User.create({
    name: 'Sunita Rao',
    email: 'sunita@gmail.com',
    password: 'password123',
    phone: '9876543213',
    societyName: 'Kashimira Heights',
    area: 'Kashimira',
    location: { lat: 19.2700, lng: 72.8700 }
  });

  // Create water requests
  const req1 = await WaterRequest.create({
    postedBy: rep1._id,
    societyName: rep1.societyName,
    area: rep1.area,
    litersNeeded: 10000,
    description: 'No water supply for 3 days. 50 families affected. Urgent help needed.',
    urgency: 'critical',
    agreedCostSplit: 500,
    status: 'open'
  });

  const req2 = await WaterRequest.create({
    postedBy: rep3._id,
    societyName: rep3.societyName,
    area: rep3.area,
    litersNeeded: 5000,
    description: 'Pipeline maintenance going on. Need water for 2 days.',
    urgency: 'moderate',
    agreedCostSplit: 300,
    status: 'helper_found',
    helperSociety: rep2._id
  });

  const req3 = await WaterRequest.create({
    postedBy: rep4._id,
    societyName: rep4.societyName,
    area: rep4.area,
    litersNeeded: 3000,
    description: 'Low water pressure since morning. Need partial supply.',
    urgency: 'low',
    agreedCostSplit: 200,
    status: 'in_transit',
    helperSociety: rep2._id,
    transport: {
      vehicleNumber: 'MH04 AB 1234',
      driverName: 'Raju Tanker',
      currentLocation: { lat: 19.2800, lng: 72.8600 },
      isTracking: true
    }
  });

  // Create messages
  await Message.create([
    {
      senderId: rep1._id,
      content: 'Hello everyone, our society is facing severe water shortage. Anyone who can help please respond.',
      requestId: null
    },
    {
      senderId: rep2._id,
      content: 'We have a tanker available tomorrow morning. Can help societies in Mira Road area.',
      requestId: null
    },
    {
      senderId: rep3._id,
      content: 'Pipeline work will be done by Thursday. Need water till then.',
      requestId: null
    },
    {
      senderId: rep2._id,
      content: 'I can help with your request. Tanker will leave by 9am.',
      requestId: req2._id
    },
    {
      senderId: rep3._id,
      content: 'Thank you! Please send vehicle details once confirmed.',
      requestId: req2._id
    }
  ]);

  console.log('✅ Seed data inserted successfully');
  console.log('Admin login: admin@jalmitra.com / admin123');
  console.log('Rep login: rahul@gmail.com / password123');
  console.log('Rep login: priya@gmail.com / password123');
  mongoose.disconnect();
};

seed().catch(console.error);