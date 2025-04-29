// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const colors = require('colors');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctor-schedules', require('./routes/doctorScheduleRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

// Try to start the server, if port is in use, try the next port
const startServer = (port) => {
  try {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`.yellow.bold);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying ${port + 1}...`.yellow);
        startServer(port + 1);
      } else {
        console.error(err);
      }
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startServer(PORT);
