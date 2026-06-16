const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/authMiddleware');

// Helper function to adjust customer balance
const updateCustomerBalance = async (customerId, userId, type, amount, action = 'apply') => {
  const customer = await Customer.findOne({ _id: customerId, userId });
  if (!customer) return;

  // action can be: 'apply' (apply transaction impact) or 'revert' (undo transaction impact)
  const multiplier = action === 'apply' ? 1 : -1;

  if (type === 'gave') {
    // gave credit -> customer owes us -> balance decreases
    customer.balance -= amount * multiplier;
  } else if (type === 'got') {
    // got payment -> customer paid -> balance increases
    customer.balance += amount * multiplier;
  }

  await customer.save();
};

// @desc    Get all transactions for standard user
// @route   GET /api/transactions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .populate('customerId', 'name phone')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
router.post('/', protect, async (req, res) => {
  const { customerId, amount, type, note, date, dueDate, status } = req.body;

  try {
    const customer = await Customer.findOne({ _id: customerId, userId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const transaction = await Transaction.create({
      customerId,
      userId: req.user.id,
      amount,
      type,
      note,
      date: date || new Date(),
      dueDate,
      status: status || 'completed',
    });

    // Update customer balance
    await updateCustomerBalance(customerId, req.user.id, type, amount, 'apply');

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Invalid transaction data' });
  }
});

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { amount, type, note, date, dueDate, status } = req.body;

  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Step 1: Revert old balance impact
    await updateCustomerBalance(transaction.customerId, req.user.id, transaction.type, transaction.amount, 'revert');

    // Step 2: Update transaction details
    transaction.amount = amount !== undefined ? amount : transaction.amount;
    transaction.type = type || transaction.type;
    transaction.note = note !== undefined ? note : transaction.note;
    transaction.date = date || transaction.date;
    transaction.dueDate = dueDate !== undefined ? dueDate : transaction.dueDate;
    transaction.status = status || transaction.status;

    const updatedTransaction = await transaction.save();

    // Step 3: Apply new balance impact
    await updateCustomerBalance(transaction.customerId, req.user.id, transaction.type, transaction.amount, 'apply');

    res.json(updatedTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Revert balance impact
    await updateCustomerBalance(transaction.customerId, req.user.id, transaction.type, transaction.amount, 'revert');

    // Delete transaction
    await Transaction.deleteOne({ _id: req.params.id, userId: req.user.id });

    res.json({ message: 'Transaction removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
