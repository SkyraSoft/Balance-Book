const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/khathaledger');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n====================================================================`);
    console.error(`WARNING: Failed to connect to MongoDB: ${error.message}`);
    console.error(`Please ensure MongoDB is running locally or check your MONGO_URI in .env`);
    console.error(`====================================================================\n`);
  }
};

module.exports = connectDB;
