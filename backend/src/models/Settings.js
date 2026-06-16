const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  businessName: {
    type: String,
    default: 'AI-Makkah General Store',
  },
  businessPhone: {
    type: String,
    default: '+92 300 1234567',
  },
  businessAddress: {
    type: String,
    default: 'Shop #14, Model Town Market, Lahore, Pakistan',
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
}, {
  timestamps: true,
});

module.exports = mongoose.model('Settings', SettingsSchema);
