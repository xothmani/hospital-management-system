const asyncHandler = require('express-async-handler');
const Appointment = require('../models/appointmentModel');

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = asyncHandler(async (req, res) => {
  const { doctor, appointmentDate, timeSlot, reason } = req.body;

  if (!doctor || !appointmentDate || !timeSlot || !reason) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  // Check for existing appointment in the same time slot
  const existingAppointment = await Appointment.findOne({
    doctor,
    appointmentDate,
    timeSlot,
    status: 'scheduled',
  });

  if (existingAppointment) {
    res.status(400);
    throw new Error('This time slot is already booked');
  }

  const appointment = await Appointment.create({
    patient: req.user.id,
    doctor,
    appointmentDate,
    timeSlot,
    reason,
  });

  res.status(201).json(appointment);
});

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = asyncHandler(async (req, res) => {
  let query = {};

  // If user is a patient, show only their appointments
  if (req.user.role === 'patient') {
    query.patient = req.user.id;
  }
  // If user is a doctor, show only their appointments
  else if (req.user.role === 'doctor') {
    query.doctor = req.user.id;
  }

  const appointments = await Appointment.find(query)
    .populate('patient', 'name email')
    .populate('doctor', 'name email specialization')
    .sort({ appointmentDate: 1 });

  res.status(200).json(appointments);
});

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name email')
    .populate('doctor', 'name email specialization');

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Check if user has permission to view this appointment
  if (
    req.user.role !== 'admin' &&
    appointment.patient._id.toString() !== req.user.id &&
    appointment.doctor._id.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error('Not authorized to view this appointment');
  }

  res.status(200).json(appointment);
});

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Check if user has permission to update this appointment
  if (
    req.user.role !== 'admin' &&
    appointment.patient.toString() !== req.user.id &&
    appointment.doctor.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error('Not authorized to update this appointment');
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  )
    .populate('patient', 'name email')
    .populate('doctor', 'name email specialization');

  res.status(200).json(updatedAppointment);
});

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Check if user has permission to delete this appointment
  if (
    req.user.role !== 'admin' &&
    appointment.patient.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this appointment');
  }

  await appointment.deleteOne();

  res.status(200).json({ id: req.params.id });
});

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
}; 