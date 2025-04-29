const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('patient', 'doctor', 'admin'), createAppointment)
  .get(protect, getAppointments);

router.route('/:id')
  .get(protect, getAppointmentById)
  .put(protect, authorize('patient', 'doctor', 'admin'), updateAppointment)
  .delete(protect, authorize('patient', 'admin'), deleteAppointment);

module.exports = router; 