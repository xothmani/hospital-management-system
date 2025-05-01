const express = require('express');
const router = express.Router();
const { 
  createPatient, 
  getPatients, 
  getPatientById, 
  updatePatient, 
  deletePatient, 
  getPatientByUserId 
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');

// Add the user-specific route before the doctor role middleware
router.get('/user/:userId', protect, getPatientByUserId);

// Route for messaging - accessible to all authenticated users (no role check)
// This allows doctors to see patients for messaging
router.get('/for-messaging', protect, asyncHandler(async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('-password')
      .sort({ name: 1 });
    
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

// All other routes are protected and require doctor role
router.use(protect);
router.use(checkRole('doctor'));

router.route('/')
  .post(createPatient)
  .get(getPatients);

router.route('/:id')
  .get(getPatientById)
  .put(updatePatient)
  .delete(deletePatient);

module.exports = router;