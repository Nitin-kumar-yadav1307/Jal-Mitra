const Message = require('../models/Message');

const sendMessage = async (req, res) => {
  try {
    const { content, requestId } = req.body;

    const message = await Message.create({
      senderId: req.user._id,
      requestId: requestId || null,
      content
    });

    const populated = await message.populate('senderId', 'name societyName area');

    req.io.emit('message:new', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getGlobalMessages = async (req, res) => {
  try {
    const messages = await Message.find({ requestId: null })
      .populate('senderId', 'name societyName area')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRequestMessages = async (req, res) => {
  try {
    const messages = await Message.find({ requestId: req.params.requestId })
      .populate('senderId', 'name societyName area')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendMessage, getGlobalMessages, getRequestMessages };