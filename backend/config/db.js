const colors = require('colors');  // Add this line

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hospital-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.underline.bold);
    console.log('Make sure MongoDB is running on your system'.yellow);
    // Don't exit the process, let the application continue
    // process.exit(1);
  }
};

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`.red.underline.bold);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected'.yellow);
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected'.green);
});

module.exports = { connectDB }; 