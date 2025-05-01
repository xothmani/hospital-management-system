const asyncHandler = require('express-async-handler');
const Patient = require('../models/Patient');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

// @desc    Create a new patient and user account
// @route   POST /api/patients
// @access  Private (Doctors only)
const createPatient = asyncHandler(async (req, res) => {
  const { 
    name, 
    age, 
    gender, 
    phone, 
    email, 
    address, 
    medicalHistory,
    password 
  } = req.body;

  // First check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  // Create user account first
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'patient',
    contactNumber: phone,
    address
  });

  // Create patient record
  const patient = await Patient.create({
    name,
    age,
    gender,
    phone,
    email,
    address,
    medicalHistory,
    doctor: req.user._id // Associate with the doctor who's creating the patient
  });

  if (patient && user) {
    res.status(201).json({
      message: 'Patient created successfully',
      patient: {
        _id: patient._id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        medicalHistory: patient.medicalHistory,
        doctor: patient.doctor
      },
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid patient data');
  }
});

// @desc    Get all patients for a doctor
// @route   GET /api/patients
// @access  Private (Doctors only)
const getPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find({ doctor: req.user._id });
  res.status(200).json(patients);
});

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private (Doctors only)
const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({
    _id: req.params.id,
    doctor: req.user._id
  });

  if (patient) {
    res.status(200).json(patient);
  } else {
    res.status(404);
    throw new Error('Patient not found');
  }
});

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private (Doctors only)
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({
    _id: req.params.id,
    doctor: req.user._id
  });

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  const updatedPatient = await Patient.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  // If email is being updated, update the user account as well
  if (req.body.email && patient.email !== req.body.email) {
    await User.findOneAndUpdate(
      { email: patient.email },
      { 
        email: req.body.email,
        name: req.body.name || patient.name,
        contactNumber: req.body.phone || patient.phone,
        address: req.body.address || patient.address
      }
    );
  }

  res.status(200).json(updatedPatient);
});

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (Doctors only)
const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({
    _id: req.params.id,
    doctor: req.user._id
  });

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  await patient.remove();
  
  // Don't delete the user account, just the patient association
  
  res.status(200).json({ message: 'Patient removed' });
});

// @desc    Get patient by user ID
// @route   GET /api/patients/user/:userId
// @access  Private
const getPatientByUserId = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ email: req.user.email });

  if (patient) {
    res.status(200).json(patient);
  } else {
    res.status(404);
    throw new Error('Patient not found');
  }
});

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientByUserId
}; 