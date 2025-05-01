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

// Add the user-specific route before the doctor role middleware
router.get('/user/:userId', protect, getPatientByUserId);

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