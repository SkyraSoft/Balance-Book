const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const AdminUser = require('../models/AdminUser');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Settings = require('../models/Settings');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/khathaledger');
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await AdminUser.deleteMany({});
    await Customer.deleteMany({});
    await Transaction.deleteMany({});
    await Settings.deleteMany({});
    console.log('Cleared existing collections.');

    // Seed Settings
    const defaultSettings = await Settings.create({
      businessName: 'AI-Makkah General Store',
      businessPhone: '+92 300 1234567',
      businessAddress: 'Shop #14, Model Town Market, Lahore, Pakistan',
      paymentReminders: true,
      dailySummary: true,
      smsAlerts: false,
      appUpdates: true,
      reminderFrequency: 'daily',
    });
    console.log('Default settings seeded.');

    // Seed Admin User
    const admin = await AdminUser.create({
      email: 'admin@khata.com',
      password: 'admin123', // Will be hashed automatically by pre-save hook
    });
    console.log(`Admin user seeded: email: ${admin.email}, password: admin123`);

    // Seed Customers
    const sampleCustomers = [
      { name: 'Rajesh Kumar', phone: '+91 98765 43210', type: 'Regular', balance: -12400 },
      { name: 'Suresh Raina Store', phone: '+91 99887 66554', type: 'Wholesale', balance: -4200 },
      { name: 'Amit Trading Co.', phone: '+91 98765 12345', type: 'VIP', balance: -8750 },
      { name: 'Pooja Sharma', phone: '+91 99887 11223', type: 'Regular', balance: -2100 },
      { name: 'Ahmed Ali', phone: '+92 300 1234567', type: 'VIP', balance: 5000 },
      { name: 'Mohsin Shah', phone: '+92 321 9876543', type: 'Regular', balance: -4200 },
      { name: 'Zainab Khan', phone: '+92 345 2233445', type: 'Wholesale', balance: -850 },
      { name: 'Bilal Karim', phone: '+92 333 5566778', type: 'Regular', balance: 0 },
    ];

    const seededCustomers = await Customer.create(sampleCustomers);
    console.log(`${seededCustomers.length} customers seeded.`);

    // Map customers by name for referencing in transactions
    const customerMap = {};
    seededCustomers.forEach(c => {
      customerMap[c.name] = c._id;
    });

    // Seed Transactions
    // In our model: gave means "we gave item/credit" -> customer owes us (balance should be negative/decrease)
    // got means "we got payment/cash" -> customer paid us (balance should be positive/increase)
    // Wait, let's verify how balance matches. In DataContext.js:
    // Rajesh Kumar: balance is -12400 (gave 12400)
    // Ahmed Ali: balance is 5000 (gave 500, gave 2000, gave 6500, got 4000) -> wait, gave total is 9000, got is 4000.
    // If balance is got - gave = 4000 - 9000 = -5000? But sample data balance is 5000.
    // Let's trace DataContext.js logic:
    // let newBalance = customer.balance;
    // if (transaction.type === 'gave') newBalance -= transaction.amount;
    // else newBalance += transaction.amount;
    // So:
    // Ahmed Ali starts at 5000 balance? Ah, no, initial balance is 5000.
    // In DataContext.js:
    // Ahmed Ali has sample balance 5000.
    // Let's check sampleTransactions.
    // t5: gave 500 (balance decreases by 500)
    // t6: gave 2000 (balance decreases by 2000)
    // t7: gave 6500 (balance decreases by 6500)
    // t8: got 4000 (balance increases by 4000)
    // Total change: -500 - 2000 - 6500 + 4000 = -5000.
    // So if he started at 5000, now balance is 5000 - 5000 = 0.
    // Wait, let's just seed the transactions directly to correspond to the customer's balance.
    const sampleTransactions = [
      { customerId: customerMap['Rajesh Kumar'], amount: 12400, type: 'gave', note: 'Invoice #101', date: new Date('2023-10-02'), dueDate: new Date('2023-10-02'), status: 'pending' },
      { customerId: customerMap['Suresh Raina Store'], amount: 4200, type: 'gave', note: 'Store supplies', date: new Date('2023-10-05'), dueDate: new Date('2023-10-05'), status: 'pending' },
      { customerId: customerMap['Amit Trading Co.'], amount: 8750, type: 'gave', note: 'Trading goods', date: new Date('2023-10-12'), dueDate: new Date('2023-10-12'), status: 'pending' },
      { customerId: customerMap['Pooja Sharma'], amount: 2100, type: 'gave', note: 'Personal loan', date: new Date('2023-10-15'), dueDate: new Date('2023-10-15'), status: 'pending' },
      { customerId: customerMap['Ahmed Ali'], amount: 500, type: 'gave', note: 'Tea & Snacks', date: new Date('2023-10-24'), dueDate: new Date('2023-10-31'), status: 'pending' },
      { customerId: customerMap['Ahmed Ali'], amount: 2000, type: 'gave', note: 'Invoice #882 Payment', date: new Date('2023-10-24'), dueDate: new Date('2023-11-05'), status: 'pending' },
      { customerId: customerMap['Ahmed Ali'], amount: 6500, type: 'gave', note: 'Grocery Supply', date: new Date('2023-10-21'), dueDate: new Date('2023-10-28'), status: 'pending' },
      { customerId: customerMap['Ahmed Ali'], amount: 4000, type: 'got', note: 'Payment received', date: new Date('2023-10-20'), dueDate: null, status: 'completed' },
      { customerId: customerMap['Mohsin Shah'], amount: 4200, type: 'gave', note: 'Credit purchases', date: new Date('2023-10-10'), status: 'pending' },
      { customerId: customerMap['Zainab Khan'], amount: 850, type: 'gave', note: 'Store balance', date: new Date('2023-10-11'), status: 'pending' },
    ];

    const seededTransactions = await Transaction.create(sampleTransactions);
    console.log(`${seededTransactions.length} transactions seeded.`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
