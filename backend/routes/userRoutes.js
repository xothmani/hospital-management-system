const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getUsers,
  updateProfile,
  getPatients,
  getDoctors,
  getAllUsers,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/', getUsers);  // ✅ Add this line to get all users
router.put('/profile', protect, updateProfile);
router.route('/patients').get(getPatients);
router.route('/doctors').get(getDoctors);
router.route('/all').get(getAllUsers);

module.exports = router; 