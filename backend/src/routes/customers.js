const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all customers for standard user
// @route   GET /api/customers
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single customer details & transactions
// @route   GET /api/customers/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const transactions = await Transaction.find({ 
      customerId: req.params.id,
      userId: req.user.id
    }).sort({ date: -1 });
    
    res.json({
      customer,
      transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, phone, type, initialBalance, balanceType, pairedUserId } = req.body;

  try {
    let startingBalance = 0;
    if (initialBalance) {
      const parsedBalance = parseFloat(initialBalance);
      if (!isNaN(parsedBalance)) {
        startingBalance = balanceType === 'gave' ? -parsedBalance : parsedBalance;
      }
    }

    const customer = await Customer.create({
      userId: req.user.id,
      name,
      phone,
      type: type || 'Regular',
      balance: startingBalance,
      pairedUserId: pairedUserId || null,
    });

    // If initial balance exists, also create a transaction entry for records
    if (startingBalance !== 0) {
      await Transaction.create({
        customerId: customer._id,
        userId: req.user.id,
        amount: Math.abs(startingBalance),
        type: balanceType || 'gave',
        note: 'Opening Balance',
        date: new Date(),
        status: 'pending',
      });
    }

    res.status(201).json(customer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Invalid customer data' });
  }
});

// @desc    Update customer details
// @route   PUT /api/customers/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { name, phone, type, pairedUserId } = req.body;

  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user.id });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.name = name || customer.name;
    customer.phone = phone !== undefined ? phone : customer.phone;
    customer.type = type || customer.type;
    customer.pairedUserId = pairedUserId !== undefined ? pairedUserId : customer.pairedUserId;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete customer & their transactions
// @route   DELETE /api/customers/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user.id });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Delete associated transactions
    await Transaction.deleteMany({ customerId: req.params.id, userId: req.user.id });
    
    // Delete customer
    await Customer.deleteOne({ _id: req.params.id, userId: req.user.id });

    res.json({ message: 'Customer and ledger entries removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
