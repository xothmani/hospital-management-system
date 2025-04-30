const express = require('express');
const router = express.Router();
const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All routes are protected and require doctor role
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