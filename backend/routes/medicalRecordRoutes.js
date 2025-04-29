const express = require('express');
const router = express.Router();
const {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require('../controllers/medicalRecordController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('doctor', 'admin'), createMedicalRecord)
  .get(protect, getMedicalRecords);

router.route('/:id')
  .get(protect, getMedicalRecordById)
  .put(protect, authorize('doctor', 'admin'), updateMedicalRecord)
  .delete(protect, authorize('admin'), deleteMedicalRecord);

module.exports = router; 