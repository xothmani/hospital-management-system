const asyncHandler = require('express-async-handler');
const MedicalRecord = require('../models/medicalRecordModel');

// @desc    Create new medical record
// @route   POST /api/medical-records
// @access  Private (Doctors only)
const createMedicalRecord = asyncHandler(async (req, res) => {
  const { patient, diagnosis, prescription, symptoms, testResults, notes } = req.body;

  if (!patient || !diagnosis) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  // Only doctors can create medical records
  if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only doctors can create medical records');
  }

  const medicalRecord = await MedicalRecord.create({
    patient,
    doctor: req.user.id,
    diagnosis,
    prescription,
    symptoms,
    testResults,
    notes,
  });

  res.status(201).json(medicalRecord);
});

// @desc    Get all medical records
// @route   GET /api/medical-records
// @access  Private
const getMedicalRecords = asyncHandler(async (req, res) => {
  let query = {};

  // If user is a patient, show only their records
  if (req.user.role === 'patient') {
    query.patient = req.user.id;
  }
  // If user is a doctor, show only records they created
  else if (req.user.role === 'doctor') {
    query.doctor = req.user.id;
  }

  const medicalRecords = await MedicalRecord.find(query)
    .populate('patient', 'name email')
    .populate('doctor', 'name email specialization')
    .sort({ visitDate: -1 });

  res.status(200).json(medicalRecords);
});

// @desc    Get medical record by ID
// @route   GET /api/medical-records/:id
// @access  Private
const getMedicalRecordById = asyncHandler(async (req, res) => {
  const medicalRecord = await MedicalRecord.findById(req.params.id)
    .populate('patient', 'name email')
    .populate('doctor', 'name email specialization');

  if (!medicalRecord) {
    res.status(404);
    throw new Error('Medical record not found');
  }

  // Check if user has permission to view this record
  if (
    req.user.role !== 'admin' &&
    medicalRecord.patient._id.toString() !== req.user.id &&
    medicalRecord.doctor._id.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error('Not authorized to view this medical record');
  }

  res.status(200).json(medicalRecord);
});

// @desc    Update medical record
// @route   PUT /api/medical-records/:id
// @access  Private (Doctors only)
const updateMedicalRecord = asyncHandler(async (req, res) => {
  const medicalRecord = await MedicalRecord.findById(req.params.id);

  if (!medicalRecord) {
    res.status(404);
    throw new Error('Medical record not found');
  }

  // Only the doctor who created the record or admin can update it
  if (
    req.user.role !== 'admin' &&
    medicalRecord.doctor.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error('Not authorized to update this medical record');
  }

  const updatedMedicalRecord = await MedicalRecord.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  )
    .populate('patient', 'name email')
    .populate('doctor', 'name email specialization');

  res.status(200).json(updatedMedicalRecord);
});

// @desc    Delete medical record
// @route   DELETE /api/medical-records/:id
// @access  Private (Admin only)
const deleteMedicalRecord = asyncHandler(async (req, res) => {
  const medicalRecord = await MedicalRecord.findById(req.params.id);

  if (!medicalRecord) {
    res.status(404);
    throw new Error('Medical record not found');
  }

  // Only admin can delete medical records
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete medical records');
  }

  await medicalRecord.deleteOne();

  res.status(200).json({ id: req.params.id });
});

module.exports = {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
}; 