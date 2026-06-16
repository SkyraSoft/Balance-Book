const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all support tickets for the current user
// @route   GET /api/tickets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create a new support ticket
// @route   POST /api/tickets
// @access  Private
router.post('/', protect, async (req, res) => {
  const { category, message } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ message: 'Please provide a message' });
    }

    const ticket = await SupportTicket.create({
      userId: req.user.id,
      category,
      message,
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update ticket status (e.g., mark as resolved)
// @route   PUT /api/tickets/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { status } = req.body;

  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, userId: req.user.id });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status || ticket.status;
    const updatedTicket = await ticket.save();

    res.json(updatedTicket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
