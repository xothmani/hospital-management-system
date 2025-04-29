const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessagesWith,
  getUnreadCount,
  markAsRead,
  getConversations
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').post(sendMessage);
router.route('/conversations').get(getConversations);
router.route('/unread/count').get(getUnreadCount);
router.route('/:messageId/read').put(markAsRead);
router.route('/:userId').get(getMessagesWith);

module.exports = router;