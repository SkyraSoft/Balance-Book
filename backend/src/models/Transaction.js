const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please add a transaction amount'],
  },
  type: {
    type: String,
    enum: ['gave', 'got'],
    required: [true, 'Please specify transaction type (gave or got)'],
  },
  note: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'completed',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', TransactionSchema);
