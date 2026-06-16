const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  businessName: {
    type: String,
    default: 'Balance Book Merchant',
  },
  businessPhone: {
    type: String,
    default: '',
  },
  businessAddress: {
    type: String,
    default: '',
  },
  profileImage: {
    type: String, // base64 representation
    default: '',
  },
  appLockPin: {
    type: String,
    default: '',
  },
  isAppLockEnabled: {
    type: Boolean,
    default: false,
  },
  isBiometricEnabled: {
    type: Boolean,
    default: false,
  },
  paymentReminders: {
    type: Boolean,
    default: true,
  },
  dailySummary: {
    type: Boolean,
    default: true,
  },
  smsAlerts: {
    type: Boolean,
    default: false,
  },
  appUpdates: {
    type: Boolean,
    default: true,
  },
  reminderFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  },
  dailyActiveSeconds: {
    type: Number,
    default: 0,
  },
  lastActiveTime: {
    type: Date,
    default: Date.now,
  },
  pairedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
