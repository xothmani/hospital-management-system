const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');

// Since we're using the user model for doctors, we'll just add specific doctor routes here

// Base route - accessible to any authenticated user for doctor list
// Original route that you had
router.get('/', protect, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('-password')
      .sort({ name: 1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Alternative implementation using asyncHandler (functionally the same)
// router.get('/', protect, asyncHandler(async (req, res) => {
//   const doctors = await User.find({ role: 'doctor' })
//     .select('-password')
//     .sort({ name: 1 });
  
//   res.status(200).json(doctors);
// }));

// Additional doctor routes can be added here
// For example, to get a specific doctor by ID
router.get('/:id', protect, asyncHandler(async (req, res) => {
  try {
    const doctor = await User.findOne({
      _id: req.params.id,
      role: 'doctor'
    }).select('-password');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

module.exports = router;