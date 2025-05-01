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

  // Check for role-based restrictions
  const sender = await User.findById(req.user._id);
  
  // Admin can message anyone
  if (sender.role !== 'admin') {
    // Doctor can only message patients and admin
    if (sender.role === 'doctor' && 
        receiver.role !== 'patient' && 
        receiver.role !== 'admin') {
      res.status(403);
      throw new Error('Doctors can only message patients or admin');
    }
    
    // Patient can only message doctors and admin
    if (sender.role === 'patient' && 
        receiver.role !== 'doctor' && 
        receiver.role !== 'admin') {
      res.status(403);
      throw new Error('Patients can only message doctors or admin');
    }
    
    // Staff (nurses, etc.) can only message admin
    if ((sender.role === 'nurse' || sender.role === 'staff') && 
        receiver.role !== 'admin') {
      res.status(403);
      throw new Error('Staff can only message admin');
    }
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

// @desc    Get messages between current user and specific user
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

  // Check if user is the receiver of the message
  if (message.receiver.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to mark this message as read');
  }

  message.read = true;
  message.readAt = new Date();
  await message.save();

  const updatedMessage = await Message.findById(message._id)
    .populate('sender', 'name role')
    .populate('receiver', 'name role');

  res.json(updatedMessage);
});

// @desc    Get user's recent conversations
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  // First, find all unique users the current user has messaged with
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { receiver: req.user._id }]
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name role specialization')
    .populate('receiver', 'name role specialization');

  // Create a map to track unique conversations and their last message
  const conversationsMap = new Map();

  messages.forEach(message => {
    // Determine who is the other user in this conversation
    const otherUser = message.sender._id.toString() === req.user._id.toString()
      ? message.receiver
      : message.sender;
    
    const otherUserId = otherUser._id.toString();
    
    // If we haven't processed this user yet, add them to our map
    if (!conversationsMap.has(otherUserId)) {
      // Count unread messages from this user
      const unreadCount = messages.filter(m =>
        m.receiver._id.toString() === req.user._id.toString() &&
        m.sender._id.toString() === otherUserId &&
        !m.read
      ).length;
      
      conversationsMap.set(otherUserId, {
        user: {
          _id: otherUser._id,
          name: otherUser.name,
          role: otherUser.role,
          specialization: otherUser.specialization
        },
        lastMessage: {
          _id: message._id,
          content: message.content,
          createdAt: message.createdAt
        },
        unreadCount
      });
    }
  });
  
  // Convert map to array of conversations
  const conversations = Array.from(conversationsMap.values());
  
  // Filter based on user role (except for admin who can see all)
  let filteredConversations = conversations;
  
  const user = await User.findById(req.user._id);
  
  if (user.role !== 'admin') {
    if (user.role === 'doctor') {
      // Doctors can message patients and admin
      filteredConversations = conversations.filter(
        conv => conv.user.role === 'patient' || conv.user.role === 'admin'
      );
    } else if (user.role === 'patient') {
      // Patients can message doctors and admin
      filteredConversations = conversations.filter(
        conv => conv.user.role === 'doctor' || conv.user.role === 'admin'
      );
    } else {
      // Staff (nurses, etc.) can only message admin
      filteredConversations = conversations.filter(
        conv => conv.user.role === 'admin'
      );
    }
  }

  res.json(filteredConversations);
});

// @desc    Get all available users to message (based on user role)
// @route   GET /api/messages/available-contacts
// @access  Private
const getAvailableContacts = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id);
  let query = {};
  
  // Filter available contacts based on user role
  if (currentUser.role === 'admin') {
    // Admin can message anyone
    query = { _id: { $ne: req.user._id } };
  } else if (currentUser.role === 'doctor') {
    // Doctors can only message patients and admin
    query = { 
      role: { $in: ['patient', 'admin'] }
    };
  } else if (currentUser.role === 'patient') {
    // Patients can only message doctors and admin
    query = { 
      role: { $in: ['doctor', 'admin'] }
    };
  } else {
    // Staff (nurses, etc.) can only message admin
    query = { role: 'admin' };
  }
  
  const contacts = await User.find(query)
    .select('name role specialization email contactNumber')
    .sort({ role: 1, name: 1 });
  
  res.json(contacts);
});

module.exports = {
  sendMessage,
  getMessagesWith,
  getUnreadCount,
  markAsRead,
  getConversations,
  getAvailableContacts
};