const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Patient = require('../models/Patient');
const User = require('../models/userModel');

// @route   GET /api/patients
// @desc    Get all patients for the authenticated doctor
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const patients = await Patient.find({ doctor: req.user.id })
      .sort({ createdAt: -1 })
      .populate('doctor', 'name');
    
    res.json(patients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/patients
// @desc    Create a new patient
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, age, gender, phone, email, address, medicalHistory } = req.body;

    const patient = new Patient({
      name,
      age,
      gender,
      phone,
      email,
      address,
      medicalHistory,
      doctor: req.user.id,
    });

    const savedPatient = await patient.save();
    res.json(savedPatient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/patients/:id
// @desc    Update a patient
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, age, gender, phone, email, address, medicalHistory } = req.body;

    // Build patient object
    const patientFields = {};
    if (name) patientFields.name = name;
    if (age) patientFields.age = age;
    if (gender) patientFields.gender = gender;
    if (phone) patientFields.phone = phone;
    if (email) patientFields.email = email;
    if (address) patientFields.address = address;
    if (medicalHistory) patientFields.medicalHistory = medicalHistory;

    let patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    // Make sure user is the doctor who created this patient
    if (patient.doctor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: patientFields },
      { new: true }
    );

    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/patients/:id
// @desc    Delete a patient
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    // Make sure user is the doctor who created this patient
    if (patient.doctor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await patient.remove();
    res.json({ msg: 'Patient removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
