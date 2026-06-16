const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const SupportTicket = require('../models/SupportTicket');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @desc    Get system dashboard metrics (stores list, tickets, cash aggregations)
// @route   GET /api/admin/dashboard
// @access  Private (Admin Only)
router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({});
    const totalUsers = await User.countDocuments({});
    
    // Aggregation of total gave / got from transaction logs
    const transactions = await Transaction.find({});
    
    let totalGave = 0;
    let totalGot = 0;
    transactions.forEach(t => {
      if (t.type === 'gave') totalGave += t.amount;
      else if (t.type === 'got') totalGot += t.amount;
    });

    const netReceivables = totalGave - totalGot;
    
    // Recent transaction logs across all users
    const recentTransactions = await Transaction.find({})
      .populate('customerId', 'name')
      .populate('userId', 'businessName email')
      .sort({ date: -1 })
      .limit(5);

    // Support tickets
    const tickets = await SupportTicket.find({})
      .populate('userId', 'email businessName businessPhone')
      .sort({ createdAt: -1 });

    const openTicketsCount = await SupportTicket.countDocuments({ status: 'open' });

    // List of all merchants/users with their active time
    const users = await User.find({}).select('email businessName businessPhone dailyActiveSeconds lastActiveTime createdAt');

    res.json({
      totalUsers,
      totalCustomers,
      totalGave,
      totalGot,
      netReceivables,
      recentTransactions,
      users,
      tickets,
      openTicketsCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update support ticket status
// @route   PUT /api/admin/tickets/:id
// @access  Private (Admin Only)
router.put('/tickets/:id', protect, adminOnly, async (req, res) => {
  const { status } = req.body;

  if (!['open', 'resolved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    await ticket.save();

    res.json({ success: true, ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
