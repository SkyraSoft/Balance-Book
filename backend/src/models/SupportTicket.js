const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Payment', 'Backup', 'Login/App Lock', 'Reports', 'Other'],
    default: 'Other',
  },
  message: {
    type: String,
    required: [true, 'Please add your message'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
