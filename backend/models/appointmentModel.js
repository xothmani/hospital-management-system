const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Please add appointment date']
    },
    timeSlot: {
      type: String,
      required: [true, 'Please add time slot']
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    reason: {
      type: String,
      required: [true, 'Please add reason for appointment']
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema); 