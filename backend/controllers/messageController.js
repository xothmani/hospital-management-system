const asyncHandler = require('express-async-handler');
const Message = require('../models/messageModel');
const User = require('../models/userModel');

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    res.status(400);
    throw new Error('Please provide receiver and message content');
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    res.status(404);
    throw new Error('Receiver not found');
  }

  const message = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    content
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name role')
    .populate('receiver', 'name role');

  res.status(201).json(populatedMessage);
});

// @desc    Get messages between two users
// @route   GET /api/messages/:userId
// @access  Private
const getMessagesWith = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: req.params.userId },
      { sender: req.params.userId, receiver: req.user._id }
    ]
  })
    .populate('sender', 'name role')
    .populate('receiver', 'name role')
    .sort({ createdAt: 1 });

  res.json(messages);
});

// @desc    Get unread messages count
// @route   GET /api/messages/unread/count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({
    receiver: req.user._id,
    read: false
  });

  res.json({ unreadCount: count });
});

// @desc    Mark message as read
// @route   PUT /api/messages/:messageId/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  if (message.receiver.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  message.read = true;
  message.readAt = new Date();
  await message.save();

  res.json(message);
});

// @desc    Get user's recent conversations
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { receiver: req.user._id }]
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name role')
    .populate('receiver', 'name role');

  const conversations = messages.reduce((acc, message) => {
    const otherUser = message.sender._id.toString() === req.user._id.toString()
      ? message.receiver
      : message.sender;

    if (!acc.some(conv => conv.user._id.toString() === otherUser._id.toString())) {
      acc.push({
        user: otherUser,
        lastMessage: message,
        unreadCount: messages.filter(m =>
          m.receiver._id.toString() === req.user._id.toString() &&
          m.sender._id.toString() === otherUser._id.toString() &&
          !m.read
        ).length
      });
    }
    return acc;
  }, []);

  res.json(conversations);
});

module.exports = {
  sendMessage,
  getMessagesWith,
  getUnreadCount,
  markAsRead,
  getConversations
};