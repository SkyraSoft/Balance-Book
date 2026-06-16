const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

// Helper to adjust customer balance
const updateCustomerBalance = async (customerId, userId, type, amount) => {
  const customer = await Customer.findOne({ _id: customerId, userId });
  if (!customer) return;

  if (type === 'gave') {
    customer.balance -= amount;
  } else if (type === 'got') {
    customer.balance += amount;
  }
  await customer.save();
};

// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id })
      .populate('senderId', 'email businessName businessPhone')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Send a pairing request by email/phone
// @route   POST /api/notifications/pair
// @access  Private
router.post('/pair', protect, async (req, res) => {
  const { email } = req.body;

  try {
    const targetEmail = email.toLowerCase().trim();
    if (targetEmail === req.user.email) {
      return res.status(400).json({ message: 'You cannot pair with yourself' });
    }

    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found in system' });
    }

    // Check if already paired
    if (req.user.pairedUsers.includes(targetUser._id)) {
      return res.status(400).json({ message: 'You are already paired with this user' });
    }

    // Check for pending request
    const pendingRequest = await Notification.findOne({
      senderId: req.user.id,
      recipientId: targetUser._id,
      type: 'pair_request',
      status: 'pending',
    });

    if (pendingRequest) {
      return res.status(400).json({ message: 'Pairing request is already pending' });
    }

    const notification = await Notification.create({
      recipientId: targetUser._id,
      senderId: req.user.id,
      type: 'pair_request',
      status: 'pending',
      message: `${req.user.businessName || req.user.email} sent you a connection request to link your ledgers.`,
    });

    res.status(201).json({ success: true, message: 'Pairing request sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Respond to notifications (accept/reject)
// @route   PUT /api/notifications/:id/respond
// @access  Private
router.put('/:id/respond', protect, async (req, res) => {
  const { status } = req.body; // 'accepted' or 'rejected'

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status response' });
  }

  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    notification.status = status;
    await notification.save();

    const sender = await User.findById(notification.senderId);
    const recipient = await User.findById(req.user.id);

    if (notification.type === 'pair_request') {
      if (status === 'accepted') {
        // Link users
        if (!recipient.pairedUsers.includes(sender._id)) {
          recipient.pairedUsers.push(sender._id);
          await recipient.save();
        }
        if (!sender.pairedUsers.includes(recipient._id)) {
          sender.pairedUsers.push(recipient._id);
          await sender.save();
        }

        // Notify sender of acceptance
        await Notification.create({
          recipientId: sender._id,
          senderId: recipient._id,
          type: 'pair_accepted',
          status: 'viewed',
          message: `${recipient.businessName || recipient.email} accepted your pairing request! You can now sync credit ledgers.`,
        });
      }
    } else if (notification.type === 'ledger_request') {
      const txData = notification.data; // { amount, type (gave/got), note, date }
      
      if (status === 'accepted') {
        // 1. Find or create a Customer under recipient representing the sender
        let customer = await Customer.findOne({
          userId: req.user.id,
          pairedUserId: sender._id,
        });

        if (!customer) {
          customer = await Customer.create({
            userId: req.user.id,
            name: sender.businessName || sender.email,
            phone: sender.businessPhone || '',
            type: 'Regular',
            balance: 0,
            pairedUserId: sender._id,
          });
        }

        // 2. Add transaction (inverse of sender's entry)
        const inverseType = txData.type === 'gave' ? 'got' : 'gave'; // If sender "gave", recipient "got"
        const newTx = await Transaction.create({
          customerId: customer._id,
          userId: req.user.id,
          amount: txData.amount,
          type: inverseType,
          note: `Synced peer entry: ${txData.note || 'None'}`,
          date: txData.date || new Date(),
          status: 'completed',
        });

        // 3. Update customer balance
        await updateCustomerBalance(customer._id, req.user.id, inverseType, txData.amount);

        // 4. Notify sender
        await Notification.create({
          recipientId: sender._id,
          senderId: recipient._id,
          type: 'ledger_response',
          status: 'viewed',
          message: `${recipient.businessName || recipient.email} accepted your transaction entry of ${txData.amount} and added it to their ledger.`,
          data: { success: true },
        });
      } else {
        // Rejected - Notify sender
        await Notification.create({
          recipientId: sender._id,
          senderId: recipient._id,
          type: 'ledger_response',
          status: 'viewed',
          message: `${recipient.businessName || recipient.email} rejected your transaction entry of ${txData.amount} as incorrect.`,
          data: { success: false },
        });
      }
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Helper route: send transaction sync request to paired customer
// @route   POST /api/notifications/sync-transaction
// @access  Private
router.post('/sync-transaction', protect, async (req, res) => {
  const { customerId, transactionId } = req.body;

  try {
    const customer = await Customer.findOne({ _id: customerId, userId: req.user.id });
    if (!customer || !customer.pairedUserId) {
      return res.status(400).json({ message: 'Customer is not paired with a Balance Book user' });
    }

    const tx = await Transaction.findOne({ _id: transactionId, customerId, userId: req.user.id });
    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const notification = await Notification.create({
      recipientId: customer.pairedUserId,
      senderId: req.user.id,
      type: 'ledger_request',
      status: 'pending',
      message: `${req.user.businessName || req.user.email} added a ledger record: ${tx.type === 'gave' ? 'lent/gave' : 'got/received'} ${tx.amount}. Confirm to log?`,
      data: {
        amount: tx.amount,
        type: tx.type,
        note: tx.note,
        date: tx.date,
      },
    });

    res.status(201).json({ success: true, message: 'Sync request sent to peer successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
