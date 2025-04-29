const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'nurse', 'staff', 'patient'],
      default: 'patient',
    },
    specialization: {
      type: String,
      required: function() {
        return this.role === 'doctor';
      },
    },
    contactNumber: {
      type: String,
      required: [true, 'Please add a contact number'],
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema); 