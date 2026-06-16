const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a customer name'],
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['Regular', 'Wholesale', 'VIP'],
    default: 'Regular',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pairedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  balance: {
    type: Number,
    default: 0, // Negative for "You Gave" (receivable), Positive for "You Got" (payable)
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Customer', CustomerSchema);
