const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get current user settings
// @route   GET /api/settings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      businessName: user.businessName,
      businessPhone: user.businessPhone,
      businessAddress: user.businessAddress,
      profileImage: user.profileImage,
      isAppLockEnabled: user.isAppLockEnabled,
      isBiometricEnabled: user.isBiometricEnabled,
      appLockPin: user.appLockPin,
      paymentReminders: user.paymentReminders,
      dailySummary: user.dailySummary,
      smsAlerts: user.smsAlerts,
      appUpdates: user.appUpdates,
      reminderFrequency: user.reminderFrequency,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
router.put('/', protect, async (req, res) => {
  const {
    businessName,
    businessPhone,
    businessAddress,
    profileImage,
    isAppLockEnabled,
    isBiometricEnabled,
    appLockPin,
    paymentReminders,
    dailySummary,
    smsAlerts,
    appUpdates,
    reminderFrequency,
  } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.businessName = businessName !== undefined ? businessName : user.businessName;
    user.businessPhone = businessPhone !== undefined ? businessPhone : user.businessPhone;
    user.businessAddress = businessAddress !== undefined ? businessAddress : user.businessAddress;
    user.profileImage = profileImage !== undefined ? profileImage : user.profileImage;
    user.isAppLockEnabled = isAppLockEnabled !== undefined ? isAppLockEnabled : user.isAppLockEnabled;
    user.isBiometricEnabled = isBiometricEnabled !== undefined ? isBiometricEnabled : user.isBiometricEnabled;
    user.appLockPin = appLockPin !== undefined ? appLockPin : user.appLockPin;
    
    user.paymentReminders = paymentReminders !== undefined ? paymentReminders : user.paymentReminders;
    user.dailySummary = dailySummary !== undefined ? dailySummary : user.dailySummary;
    user.smsAlerts = smsAlerts !== undefined ? smsAlerts : user.smsAlerts;
    user.appUpdates = appUpdates !== undefined ? appUpdates : user.appUpdates;
    user.reminderFrequency = reminderFrequency !== undefined ? reminderFrequency : user.reminderFrequency;

    const updatedUser = await user.save();
    
    res.json({
      businessName: updatedUser.businessName,
      businessPhone: updatedUser.businessPhone,
      businessAddress: updatedUser.businessAddress,
      profileImage: updatedUser.profileImage,
      isAppLockEnabled: updatedUser.isAppLockEnabled,
      isBiometricEnabled: updatedUser.isBiometricEnabled,
      appLockPin: updatedUser.appLockPin,
      paymentReminders: updatedUser.paymentReminders,
      dailySummary: updatedUser.dailySummary,
      smsAlerts: updatedUser.smsAlerts,
      appUpdates: updatedUser.appUpdates,
      reminderFrequency: updatedUser.reminderFrequency,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
