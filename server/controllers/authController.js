const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, res) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone, societyName, area, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, societyName, area, role: role || 'society_rep' });

    generateToken(user._id, res);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      societyName: user.societyName,
      area: user.area
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await user.matchPassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    generateToken(user._id, res);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      societyName: user.societyName,
      area: user.area
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { register, login, logout, getMe };