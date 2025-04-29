const mongoose = require('mongoose');

const medicalRecordSchema = mongoose.Schema(
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
    diagnosis: {
      type: String,
      required: [true, 'Please add diagnosis']
    },
    prescription: [{
      medicine: {
        type: String,
        required: true
      },
      dosage: {
        type: String,
        required: true
      },
      frequency: {
        type: String,
        required: true
      },
      duration: {
        type: String,
        required: true
      }
    }],
    symptoms: [{
      type: String
    }],
    testResults: [{
      testName: {
        type: String
      },
      testResult: {
        type: String
      },
      testDate: {
        type: Date
      }
    }],
    notes: {
      type: String
    },
    visitDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema); 