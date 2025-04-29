require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const User = require('./models/userModel');
const Appointment = require('./models/appointmentModel');
const MedicalRecord = require('./models/medicalRecordModel');
const bcrypt = require('bcryptjs');


connectDB();

// Sample Users
const users = [
  {
    name: "Dr. John Doe",
    email: "johndoe@example.com",
    password: bcrypt.hashSync("123456", 10), // ✅ Hash the password before storing it!
    role: "doctor",
    specialization: "Cardiology",
    contactNumber: "123456789",
    address: "123 Street, City",
  },
  {
    name: "Jane Smith",
    email: "janesmith@example.com",
    password: bcrypt.hashSync("123456", 10), // ✅ Hash the password
    role: "patient",
    contactNumber: "987654321",
    address: "456 Avenue, City",
  }
];

// Sample Appointments
const appointments = [
  {
    patient: null, // Will be replaced dynamically
    doctor: null, // Will be replaced dynamically
    appointmentDate: new Date(),
    timeSlot: "10:30 AM",
    status: "scheduled",
    reason: "Routine Checkup",
    notes: "Patient has mild fever."
  }
];

// Sample Medical Records
const medicalRecords = [
  {
    patient: null, // Will be replaced dynamically
    doctor: null, // Will be replaced dynamically
    diagnosis: "Hypertension",
    prescription: [
      { medicine: "Amlodipine", dosage: "5mg", frequency: "Once a day", duration: "30 days" }
    ],
    symptoms: ["High Blood Pressure"],
    testResults: [
      { testName: "Blood Pressure Test", testResult: "140/90", testDate: new Date() }
    ],
    notes: "Patient advised to monitor BP daily."
  }
];

const insertData = async () => {
  try {
    await User.deleteMany();
    await Appointment.deleteMany();
    await MedicalRecord.deleteMany();

    console.log("Database Cleared ✅");

    // Insert Users
    const createdUsers = await User.insertMany(users);
    console.log("Users Inserted ✅");

    // Assign user IDs dynamically
    appointments[0].patient = createdUsers[1]._id;
    appointments[0].doctor = createdUsers[0]._id;

    medicalRecords[0].patient = createdUsers[1]._id;
    medicalRecords[0].doctor = createdUsers[0]._id;

    // Insert Appointments
    await Appointment.insertMany(appointments);
    console.log("Appointments Inserted ✅");

    // Insert Medical Records
    await MedicalRecord.insertMany(medicalRecords);
    console.log("Medical Records Inserted ✅");

    process.exit();
  } catch (error) {
    console.error("Error inserting data:", error);
    process.exit(1);
  }
};

insertData();
