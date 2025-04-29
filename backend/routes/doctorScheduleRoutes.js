const express = require('express');
const router = express.Router();
const {
  getDoctorSchedule,
  updateWorkingHours,
  requestLeave,
  updateLeaveStatus,
  getDoctorWorkload
} = require('../controllers/doctorScheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/:doctorId', protect, getDoctorSchedule);
router.put('/hours/:doctorId', protect, authorize('doctor'), updateWorkingHours);
router.post('/leave/:doctorId', protect, authorize('doctor'), requestLeave);
router.put('/leave/:doctorId/:leaveId', protect, authorize('admin'), updateLeaveStatus);
router.get('/workload/:doctorId', protect, getDoctorWorkload);

module.exports = router;