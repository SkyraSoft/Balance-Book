const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['pair_request', 'pair_accepted', 'ledger_request', 'ledger_response'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'viewed'],
    default: 'pending',
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // stores custom transaction details, e.g. amount, transactionType, note, date, senderCustomerName
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', NotificationSchema);
