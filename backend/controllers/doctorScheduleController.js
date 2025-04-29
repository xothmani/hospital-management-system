const asyncHandler = require('express-async-handler');
const DoctorSchedule = require('../models/doctorScheduleModel');
const Appointment = require('../models/appointmentModel');

// @desc    Get doctor schedule
// @route   GET /api/doctor-schedule/:doctorId
// @access  Private
const getDoctorSchedule = asyncHandler(async (req, res) => {
  const schedule = await DoctorSchedule.findOne({ doctor: req.params.doctorId })
    .populate('doctor', 'name email specialization');

  if (!schedule) {
    res.status(404);
    throw new Error('Schedule not found');
  }

  res.status(200).json(schedule);
});

// @desc    Update doctor working hours
// @route   PUT /api/doctor-schedule/hours/:doctorId
// @access  Private (Doctor only)
const updateWorkingHours = asyncHandler(async (req, res) => {
  const { workingHours } = req.body;

  if (!workingHours || !Array.isArray(workingHours)) {
    res.status(400);
    throw new Error('Please provide valid working hours');
  }

  let schedule = await DoctorSchedule.findOne({ doctor: req.params.doctorId });

  if (!schedule) {
    schedule = await DoctorSchedule.create({
      doctor: req.params.doctorId,
      workingHours
    });
  } else {
    schedule.workingHours = workingHours;
    schedule.lastUpdated = Date.now();
    await schedule.save();
  }

  res.status(200).json(schedule);
});

// @desc    Request leave
// @route   POST /api/doctor-schedule/leave/:doctorId
// @access  Private (Doctor only)
const requestLeave = asyncHandler(async (req, res) => {
  const { startDate, endDate, reason } = req.body;

  if (!startDate || !endDate || !reason) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  let schedule = await DoctorSchedule.findOne({ doctor: req.params.doctorId });

  if (!schedule) {
    schedule = await DoctorSchedule.create({
      doctor: req.params.doctorId,
      leaves: [{ startDate, endDate, reason }]
    });
  } else {
    schedule.leaves.push({ startDate, endDate, reason });
    await schedule.save();
  }

  res.status(201).json(schedule);
});

// @desc    Update leave status
// @route   PUT /api/doctor-schedule/leave/:doctorId/:leaveId
// @access  Private (Admin only)
const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Please provide valid status');
  }

  const schedule = await DoctorSchedule.findOne({ doctor: req.params.doctorId });

  if (!schedule) {
    res.status(404);
    throw new Error('Schedule not found');
  }

  const leave = schedule.leaves.id(req.params.leaveId);
  if (!leave) {
    res.status(404);
    throw new Error('Leave request not found');
  }

  leave.status = status;
  await schedule.save();

  res.status(200).json(schedule);
});

// @desc    Get doctor workload
// @route   GET /api/doctor-schedule/workload/:doctorId
// @access  Private
const getDoctorWorkload = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointments = await Appointment.find({
    doctor: req.params.doctorId,
    appointmentDate: {
      $gte: today
    },
    status: 'scheduled'
  });

  const schedule = await DoctorSchedule.findOne({ doctor: req.params.doctorId });
  if (schedule) {
    schedule.currentWorkload = appointments.length;
    await schedule.save();
  }

  res.status(200).json({
    totalAppointments: appointments.length,
    maxPatientsPerDay: schedule ? schedule.maxPatientsPerDay : 20,
    workloadPercentage: schedule ? (appointments.length / schedule.maxPatientsPerDay) * 100 : 0
  });
});

module.exports = {
  getDoctorSchedule,
  updateWorkingHours,
  requestLeave,
  updateLeaveStatus,
  getDoctorWorkload
};