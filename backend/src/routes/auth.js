const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecrettokenkeyforkhathaledger',
    { expiresIn: '30d' }
  );
};

// Ensure default admin and default store user exist on start
const seedDefaultUsers = async () => {
  try {
    const adminExists = await AdminUser.findOne({ email: 'admin@khata.com' });
    if (!adminExists) {
      await AdminUser.create({
        email: 'admin@khata.com',
        password: 'admin123'
      });
      console.log('Seeded default admin user');
    }

    const userExists = await User.findOne({ email: 'store@khata.com' });
    if (!userExists) {
      await User.create({
        email: 'store@khata.com',
        password: 'store123',
        businessName: 'AI-Makkah General Store',
        businessPhone: '+92 300 1234567',
        businessAddress: 'Shop #14, Model Town Market, Lahore, Pakistan',
      });
      console.log('Seeded default store user');
    }
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};
seedDefaultUsers();

// @desc    Register standard user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { email, password, businessName, businessPhone, businessAddress } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      businessName: businessName || 'Balance Book Merchant',
      businessPhone: businessPhone || '',
      businessAddress: businessAddress || '',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        businessName: user.businessName,
        token: generateToken(user._id),
        role: 'user',
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const sanitizedEmail = email.toLowerCase().trim();

  try {
    // 1. Check if they are AdminUser
    const admin = await AdminUser.findOne({ email: sanitizedEmail }).select('+password');
    if (admin) {
      const isMatch = await admin.matchPassword(password);
      if (isMatch) {
        return res.json({
          _id: admin._id,
          email: admin.email,
          token: generateToken(admin._id),
          role: 'admin',
        });
      }
    }

    // 2. Check if they are standard User
    const user = await User.findOne({ email: sanitizedEmail }).select('+password');
    if (user) {
      const isMatch = await user.matchPassword(password);
      if (isMatch) {
        return res.json({
          _id: user._id,
          email: user.email,
          businessName: user.businessName,
          token: generateToken(user._id),
          role: 'user',
        });
      }
    }

    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('pairedUsers', 'email businessName businessPhone');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.businessName = req.body.businessName !== undefined ? req.body.businessName : user.businessName;
    user.businessPhone = req.body.businessPhone !== undefined ? req.body.businessPhone : user.businessPhone;
    user.businessAddress = req.body.businessAddress !== undefined ? req.body.businessAddress : user.businessAddress;
    user.profileImage = req.body.profileImage !== undefined ? req.body.profileImage : user.profileImage;
    user.appLockPin = req.body.appLockPin !== undefined ? req.body.appLockPin : user.appLockPin;
    user.isAppLockEnabled = req.body.isAppLockEnabled !== undefined ? req.body.isAppLockEnabled : user.isAppLockEnabled;
    user.isBiometricEnabled = req.body.isBiometricEnabled !== undefined ? req.body.isBiometricEnabled : user.isBiometricEnabled;
    
    // Also support notification settings inside the user profile
    user.paymentReminders = req.body.paymentReminders !== undefined ? req.body.paymentReminders : user.paymentReminders;
    user.dailySummary = req.body.dailySummary !== undefined ? req.body.dailySummary : user.dailySummary;
    user.smsAlerts = req.body.smsAlerts !== undefined ? req.body.smsAlerts : user.smsAlerts;
    user.appUpdates = req.body.appUpdates !== undefined ? req.body.appUpdates : user.appUpdates;
    user.reminderFrequency = req.body.reminderFrequency !== undefined ? req.body.reminderFrequency : user.reminderFrequency;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update daily active time
// @route   POST /api/auth/active-time
// @access  Private
router.post('/active-time', protect, async (req, res) => {
  const { activeSeconds } = req.body;
  if (!activeSeconds || isNaN(activeSeconds)) {
    return res.status(400).json({ message: 'Invalid activeSeconds duration' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.dailyActiveSeconds = (user.dailyActiveSeconds || 0) + Number(activeSeconds);
    user.lastActiveTime = new Date();
    await user.save();

    res.json({ success: true, dailyActiveSeconds: user.dailyActiveSeconds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete account permanently
// @route   DELETE /api/auth/delete-account
// @access  Private
router.delete('/delete-account', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Delete all transactions
    await Transaction.deleteMany({ userId });

    // 2. Delete all customers
    await Customer.deleteMany({ userId });

    // 3. Delete all notifications (sent or received)
    await Notification.deleteMany({
      $or: [{ recipientId: userId }, { senderId: userId }],
    });

    // 4. Delete user record
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'Account permanently deleted along with all credit records' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Check which phone numbers are registered
// @route   POST /api/auth/check-contacts
// @access  Private
router.post('/check-contacts', protect, async (req, res) => {
  const { phones } = req.body;
  if (!phones || !Array.isArray(phones)) {
    return res.status(400).json({ message: 'Invalid phone list' });
  }
  try {
    const registeredUsers = await User.find({ businessPhone: { $in: phones } }).select('businessPhone _id');
    const registeredData = registeredUsers.map(u => ({ phone: u.businessPhone, userId: u._id }));
    res.json(registeredData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
