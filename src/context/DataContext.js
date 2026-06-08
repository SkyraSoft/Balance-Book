import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfWeek, endOfWeek, isWithinInterval, isBefore } from 'date-fns';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const STORAGE_KEYS = {
  CUSTOMERS: '@balancebook_customers',
  TRANSACTIONS: '@balancebook_transactions',
  SETTINGS: '@balancebook_settings',
};

const sampleCustomers = [
  { id: '1', name: 'Rajesh Kumar', phone: '+91 98765 43210', type: 'Regular', balance: -12400 },
  { id: '2', name: 'Suresh Raina Store', phone: '+91 99887 66554', type: 'Wholesale', balance: -4200 },
  { id: '3', name: 'Amit Trading Co.', phone: '+91 98765 12345', type: 'VIP', balance: -8750 },
  { id: '4', name: 'Pooja Sharma', phone: '+91 99887 11223', type: 'Regular', balance: -2100 },
  { id: '5', name: 'Ahmed Ali', phone: '+92 300 1234567', type: 'VIP', balance: 5000 },
  { id: '6', name: 'Mohsin Shah', phone: '+92 321 9876543', type: 'Regular', balance: -4200 },
  { id: '7', name: 'Zainab Khan', phone: '+92 345 2233445', type: 'Wholesale', balance: -850 },
  { id: '8', name: 'Bilal Karim', phone: '+92 333 5566778', type: 'Regular', balance: 0 },
];

const sampleTransactions = [
  { id: 't1', customerId: '1', amount: 12400, type: 'gave', note: 'Invoice #101', date: '2023-10-02', dueDate: '2023-10-02', status: 'pending' },
  { id: 't2', customerId: '2', amount: 4200, type: 'gave', note: 'Store supplies', date: '2023-10-05', dueDate: '2023-10-05', status: 'pending' },
  { id: 't3', customerId: '3', amount: 8750, type: 'gave', note: 'Trading goods', date: '2023-10-12', dueDate: '2023-10-12', status: 'pending' },
  { id: 't4', customerId: '4', amount: 2100, type: 'gave', note: 'Personal loan', date: '2023-10-15', dueDate: '2023-10-15', status: 'pending' },
  { id: 't5', customerId: '5', amount: 500, type: 'gave', note: 'Tea & Snacks', date: '2023-10-24', dueDate: '2023-10-31', status: 'pending' },
  { id: 't6', customerId: '5', amount: 2000, type: 'gave', note: 'Invoice #882 Payment', date: '2023-10-24', dueDate: '2023-11-05', status: 'pending' },
  { id: 't7', customerId: '5', amount: 6500, type: 'gave', note: 'Grocery Supply', date: '2023-10-21', dueDate: '2023-10-28', status: 'pending' },
  { id: 't8', customerId: '5', amount: 4000, type: 'got', note: 'Payment received', date: '2023-10-20', dueDate: null, status: 'completed' },
];

export const DataProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({
    businessName: 'AI-Makkah General Store',
    businessPhone: '+92 300 1234567',
    businessAddress: 'Shop #14, Model Town Market, Lahore, Pakistan',
    notifications: {
      paymentReminders: true,
      dailySummary: true,
      smsAlerts: false,
      appUpdates: true,
      reminderFrequency: 'daily',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedCustomers = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const storedTransactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const storedSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      else {
        setCustomers(sampleCustomers);
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(sampleCustomers));
      }

      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
      else {
        setTransactions(sampleTransactions);
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(sampleTransactions));
      }

      if (storedSettings) setSettings(JSON.parse(storedSettings));
      else await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveCustomers = async (newCustomers) => {
    setCustomers(newCustomers);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(newCustomers));
  };

  const saveTransactions = async (newTransactions) => {
    setTransactions(newTransactions);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTransactions));
  };

  const addCustomer = async (customer) => {
    const newCustomer = { ...customer, id: Date.now().toString() };
    const newCustomers = [...customers, newCustomer];
    await saveCustomers(newCustomers);
    return newCustomer;
  };

  const updateCustomerBalance = async (customerId, newBalance) => {
    const updatedCustomers = customers.map(c =>
      c.id === customerId ? { ...c, balance: newBalance } : c
    );
    await saveCustomers(updatedCustomers);
  };

  const addTransaction = async (transaction) => {
    const newTransaction = { ...transaction, id: Date.now().toString() };
    const newTransactions = [...transactions, newTransaction];
    await saveTransactions(newTransactions);

    const customer = customers.find(c => c.id === transaction.customerId);
    if (customer) {
      let newBalance = customer.balance;
      if (transaction.type === 'gave') newBalance -= transaction.amount;
      else newBalance += transaction.amount;
      await updateCustomerBalance(transaction.customerId, newBalance);
    }
    return newTransaction;
  };

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  };

  const getDueTransactions = () => {
    const today = new Date();
    const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 });
    const endOfWeekDate = endOfWeek(today, { weekStartsOn: 1 });

    const pendingTransactions = transactions.filter(t => t.type === 'gave' && t.status === 'pending');

    const overdue = pendingTransactions.filter(t => t.dueDate && isBefore(new Date(t.dueDate), today));
    const upcomingThisWeek = pendingTransactions.filter(t =>
      t.dueDate && isWithinInterval(new Date(t.dueDate), { start: startOfWeekDate, end: endOfWeekDate })
    );
    const weekTotal = upcomingThisWeek.reduce((sum, t) => sum + t.amount, 0);

    return { overdue, upcomingThisWeek, weekTotal, weekCount: upcomingThisWeek.length };
  };

  const getCustomerTransactions = (customerId, filter = 'all') => {
    let filtered = transactions.filter(t => t.customerId === customerId);
    if (filter === 'gave') filtered = filtered.filter(t => t.type === 'gave');
    if (filter === 'got') filtered = filtered.filter(t => t.type === 'got');
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <DataContext.Provider value={{
      customers,
      transactions,
      settings,
      addCustomer,
      addTransaction,
      updateSettings,
      getDueTransactions,
      getCustomerTransactions,
      saveCustomers,
      saveTransactions,
    }}>
      {children}
    </DataContext.Provider>
  );
};
