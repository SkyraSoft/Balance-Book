import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfWeek, endOfWeek, isWithinInterval, isBefore } from 'date-fns';
import { TRANSLATIONS } from '../utils/translations';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { CURRENCIES } from '../utils/currencies';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, onSnapshot, addDoc, arrayUnion, increment } from 'firebase/firestore';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const STORAGE_KEYS = {
  CUSTOMERS: '@balancebook_customers',
  TRANSACTIONS: '@balancebook_transactions',
  SETTINGS: '@balancebook_settings',
  BACKEND_URL: '@balancebook_backend_url',
  USER_ROLE: '@balancebook_user_role',
  LANGUAGE: '@balancebook_language',
  CURRENCY: '@balancebook_currency',
  ONBOARDED: '@balancebook_onboarded',
  TOKEN: '@balancebook_token',
  USER_EMAIL: '@balancebook_user_email',
  APP_LOCK_PIN: '@balancebook_app_lock_pin',
  IS_APP_LOCK_ENABLED: '@balancebook_is_app_lock_enabled',
};

const DEFAULT_BACKEND_URL = 'Firebase';

export const DataProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [backendUrl] = useState(DEFAULT_BACKEND_URL);
  const [isOnline] = useState(true);
  const [userRole, setUserRole] = useState(null); // 'user', 'admin', or null
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [pairedUsers, setPairedUsers] = useState([]);
  
  // App Lock security state
  const [appLockPin, setAppLockPin] = useState('');
  const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);

  const [settings, setSettings] = useState({
    businessName: 'Balance Book Merchant',
    businessPhone: '',
    businessAddress: '',
    profileImage: '',
    paymentReminders: true,
    dailySummary: true,
    smsAlerts: false,
    appUpdates: true,
    reminderFrequency: 'daily',
  });

  const activeTimeIntervalRef = useRef(null);

  useEffect(() => {
    initContext();
    return () => {
      if (activeTimeIntervalRef.current) clearInterval(activeTimeIntervalRef.current);
    };
  }, []);

  // Set up active time reporting heartbeat (every 30 seconds)
  useEffect(() => {
    if (activeTimeIntervalRef.current) {
      clearInterval(activeTimeIntervalRef.current);
      activeTimeIntervalRef.current = null;
    }

    if (userRole === 'user' && auth.currentUser) {
      activeTimeIntervalRef.current = setInterval(() => {
        reportActiveTime(30);
      }, 30000);
    }
  }, [userRole]);

  // Firebase Auth and Listeners observer
  useEffect(() => {
    let unsubscribeCustomers = () => {};
    let unsubscribeTransactions = () => {};
    let unsubscribeNotifications = () => {};
    let unsubscribeUser = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeCustomers();
      unsubscribeTransactions();
      unsubscribeNotifications();
      unsubscribeUser();

      if (firebaseUser) {
        const uid = firebaseUser.uid;
        setUserEmail(firebaseUser.email);
        setToken(uid); // Mock JWT token using UID to satisfy legacy checks

        // 1. Listen to user profile doc
        unsubscribeUser = onSnapshot(doc(db, 'users', uid), async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const role = userData.role || 'user';
            setUserRole(role);
            setPairedUsers(userData.pairedUsers || []);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, firebaseUser.email);
            
            // Sync Onboarding state
            if (userData.isOnboarded) {
              setIsOnboarded(true);
              await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
            }
            // Sync Language & Currency
            if (userData.language) {
              setLanguage(userData.language);
              await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, userData.language);
            }
            if (userData.currency) {
              setCurrency(userData.currency);
              await AsyncStorage.setItem(STORAGE_KEYS.CURRENCY, userData.currency);
            }

            // Set settings state
            const updatedSettings = {
              businessName: userData.businessName || 'Balance Book Merchant',
              businessPhone: userData.businessPhone || '',
              businessAddress: userData.businessAddress || '',
              profileImage: userData.profileImage || '',
              paymentReminders: userData.paymentReminders !== undefined ? userData.paymentReminders : true,
              dailySummary: userData.dailySummary !== undefined ? userData.dailySummary : true,
              smsAlerts: userData.smsAlerts !== undefined ? userData.smsAlerts : false,
              appUpdates: userData.appUpdates !== undefined ? userData.appUpdates : true,
              reminderFrequency: userData.reminderFrequency || 'daily',
            };
            setSettings(updatedSettings);
            await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));

            // Sync pin lock settings
            if (userData.appLockPin !== undefined) {
              setAppLockPin(userData.appLockPin);
              await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCK_PIN, userData.appLockPin);
            }
            if (userData.isAppLockEnabled !== undefined) {
              setIsAppLockEnabled(userData.isAppLockEnabled);
              await AsyncStorage.setItem(STORAGE_KEYS.IS_APP_LOCK_ENABLED, userData.isAppLockEnabled ? 'true' : 'false');
            }
          }
        });

        // 2. Listen to customers
        const customersQuery = query(collection(db, 'customers'), where('userId', '==', uid));
        unsubscribeCustomers = onSnapshot(customersQuery, async (querySnap) => {
          const fetchedCustomers = [];
          querySnap.forEach((doc) => {
            fetchedCustomers.push({ id: doc.id, ...doc.data() });
          });
          setCustomers(fetchedCustomers);
          await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(fetchedCustomers));
        });

        // 3. Listen to transactions
        const transactionsQuery = query(collection(db, 'transactions'), where('userId', '==', uid));
        unsubscribeTransactions = onSnapshot(transactionsQuery, async (querySnap) => {
          const fetchedTxs = [];
          querySnap.forEach((doc) => {
            fetchedTxs.push({ id: doc.id, ...doc.data() });
          });
          setTransactions(fetchedTxs);
          await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(fetchedTxs));
        });

        // 4. Listen to notifications
        const notificationsQuery = query(
          collection(db, 'notifications'), 
          where('recipientId', '==', uid)
        );
        unsubscribeNotifications = onSnapshot(notificationsQuery, async (querySnap) => {
          const fetchedNotifs = [];
          for (const d of querySnap.docs) {
            const notif = { id: d.id, ...d.data() };
            if (notif.senderId && typeof notif.senderId === 'string') {
              try {
                const sDoc = await getDoc(doc(db, 'users', notif.senderId));
                if (sDoc.exists()) {
                  notif.senderId = {
                    id: sDoc.id,
                    email: sDoc.data().email,
                    businessName: sDoc.data().businessName,
                    businessPhone: sDoc.data().businessPhone
                  };
                }
              } catch (e) {
                console.log('Error resolving notification sender details:', e);
              }
            }
            fetchedNotifs.push(notif);
          }
          fetchedNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setNotifications(fetchedNotifs);
        });

      } else {
        setUserRole(null);
        setToken(null);
        setUserEmail('');
        setCustomers([]);
        setTransactions([]);
        setNotifications([]);
        setPairedUsers([]);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeCustomers();
      unsubscribeTransactions();
      unsubscribeNotifications();
      unsubscribeUser();
    };
  }, []);

  const initContext = async () => {
    try {
      const savedRole = await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE);
      const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);

      if (savedRole) setUserRole(savedRole);
      if (savedEmail) setUserEmail(savedEmail);

      const savedLang = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      if (savedLang) setLanguage(savedLang);

      const savedCurr = await AsyncStorage.getItem(STORAGE_KEYS.CURRENCY);
      if (savedCurr) setCurrency(savedCurr);

      const savedOnboarded = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDED);
      if (savedOnboarded === 'true') setIsOnboarded(true);

      const savedPin = await AsyncStorage.getItem(STORAGE_KEYS.APP_LOCK_PIN);
      const savedLockEnabled = await AsyncStorage.getItem(STORAGE_KEYS.IS_APP_LOCK_ENABLED);
      if (savedPin) setAppLockPin(savedPin);
      if (savedLockEnabled === 'true') {
        setIsAppLockEnabled(true);
        setIsAppUnlocked(false);
      } else {
        setIsAppUnlocked(true);
      }
      
      await loadLocalCache();
    } catch (error) {
      console.error('Error initializing context:', error);
    }
  };

  const loadLocalCache = async () => {
    const cachedCustomers = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    const cachedTransactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const cachedSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (cachedCustomers) setCustomers(JSON.parse(cachedCustomers));
    if (cachedTransactions) setTransactions(JSON.parse(cachedTransactions));
    if (cachedSettings) setSettings(JSON.parse(cachedSettings));
  };

  const syncWithServer = async () => {
    console.log('Firebase sync is running in real-time.');
  };

  const reportActiveTime = async (activeSeconds) => {
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        dailyActiveSeconds: increment(activeSeconds),
        lastActiveTime: new Date().toISOString()
      });
    } catch (err) {
      console.log('Failed to report session activity metrics to Firestore.');
    }
  };

  const loginUser = async (email, password) => {
    try {
      const sanitizedEmail = email.toLowerCase().trim();
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
      } catch (err) {
        if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') && 
            (sanitizedEmail === 'admin@khata.com' || sanitizedEmail === 'store@khata.com')) {
          userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
          const role = sanitizedEmail === 'admin@khata.com' ? 'admin' : 'user';
          const uid = userCredential.user.uid;
          await setDoc(doc(db, 'users', uid), {
            email: sanitizedEmail,
            role,
            businessName: role === 'admin' ? 'Application Owner' : 'AI-Makkah General Store',
            businessPhone: role === 'admin' ? '' : '+92 300 1234567',
            normalizedPhone: role === 'admin' ? '' : '+923001234567',
            createdAt: new Date().toISOString(),
            dailyActiveSeconds: 0,
            lastActiveTime: new Date().toISOString(),
            pairedUsers: [],
          });
        } else {
          throw err;
        }
      }

      const uid = userCredential.user.uid;
      const userDoc = await getDoc(doc(db, 'users', uid));
      let role = 'user';
      if (userDoc.exists()) {
        role = userDoc.data().role || 'user';
      } else {
        await setDoc(doc(db, 'users', uid), {
          email: sanitizedEmail,
          role: 'user',
          businessName: 'Balance Book Merchant',
          businessPhone: '',
          normalizedPhone: '',
          createdAt: new Date().toISOString(),
          dailyActiveSeconds: 0,
          lastActiveTime: new Date().toISOString(),
          pairedUsers: [],
        });
      }

      setUserRole(role);
      setUserEmail(sanitizedEmail);
      setToken(uid);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, sanitizedEmail);

      return { success: true, role };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Invalid email or password' };
    }
  };

  const registerUser = async (email, password, businessName, businessPhone, businessAddress) => {
    try {
      const sanitizedEmail = email.toLowerCase().trim();
      const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
      const uid = userCredential.user.uid;

      const normalizedPhone = businessPhone ? businessPhone.replace(/[^\d+]/g, '') : '';

      const userProfile = {
        email: sanitizedEmail,
        role: 'user',
        businessName: businessName || 'Balance Book Merchant',
        businessPhone: businessPhone || '',
        normalizedPhone: normalizedPhone,
        createdAt: new Date().toISOString(),
        dailyActiveSeconds: 0,
        lastActiveTime: new Date().toISOString(),
        pairedUsers: [],
      };

      await setDoc(doc(db, 'users', uid), userProfile);

      setUserRole('user');
      setUserEmail(sanitizedEmail);
      setToken(uid);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, 'user');
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, sanitizedEmail);

      return { success: true, role: 'user' };
    } catch (error) {
      console.error(error);
      let message = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        message = 'User already exists';
      }
      return { success: false, message };
    }
  };

  const completeOnboarding = async (businessProfile) => {
    setIsOnboarded(true);
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
    
    if (businessProfile.language) {
      setLanguage(businessProfile.language);
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, businessProfile.language);
    }
    if (businessProfile.currency) {
      setCurrency(businessProfile.currency);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENCY, businessProfile.currency);
    }

    const normalizedPhone = businessProfile.phone ? businessProfile.phone.replace(/[^\d+]/g, '') : '';

    const updatedSettings = {
      ...settings,
      businessName: businessProfile.name,
      businessPhone: businessProfile.phone,
      businessAddress: businessProfile.address,
      profileImage: businessProfile.profileImage || '',
    };
    
    // Save onboarding details and survey answers inside Firestore doc
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, {
          businessName: businessProfile.name,
          businessPhone: businessProfile.phone,
          normalizedPhone: normalizedPhone,
          businessAddress: businessProfile.address,
          language: businessProfile.language || 'en',
          currency: businessProfile.currency || 'USD',
          profileImage: businessProfile.profileImage || '',
          isOnboarded: true,
          survey: {
            country: businessProfile.country || '',
            city: businessProfile.city || '',
            businessType: businessProfile.businessType || '',
            position: businessProfile.position || '',
            referralSource: businessProfile.referralSource || '',
            purpose: businessProfile.purpose || '',
            answeredAt: new Date().toISOString()
          }
        });
      } catch (err) {
        console.error('Error updating onboarding details in Firestore:', err);
      }
    }

    await updateSettings(updatedSettings);
  };

  const logOut = async () => {
    if (activeTimeIntervalRef.current) {
      clearInterval(activeTimeIntervalRef.current);
      activeTimeIntervalRef.current = null;
    }
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }

    setUserRole(null);
    setToken(null);
    setUserEmail('');
    setCustomers([]);
    setTransactions([]);
    setNotifications([]);
    setPairedUsers([]);
    setIsOnboarded(false);
    setIsAppUnlocked(false);

    await AsyncStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDED);
    await AsyncStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
  };

  const deleteAccountPermanently = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return { success: false, message: 'No authenticated user found' };
      const uid = user.uid;

      // 1. Delete all transactions
      const txQuery = query(collection(db, 'transactions'), where('userId', '==', uid));
      const txSnap = await getDocs(txQuery);
      for (const d of txSnap.docs) {
        await deleteDoc(d.ref);
      }

      // 2. Delete all customers
      const custQuery = query(collection(db, 'customers'), where('userId', '==', uid));
      const custSnap = await getDocs(custQuery);
      for (const d of custSnap.docs) {
        await deleteDoc(d.ref);
      }

      // 3. Delete all notifications (sent or received)
      const notifQuery1 = query(collection(db, 'notifications'), where('recipientId', '==', uid));
      const notifSnap1 = await getDocs(notifQuery1);
      for (const d of notifSnap1.docs) {
        await deleteDoc(d.ref);
      }
      const notifQuery2 = query(collection(db, 'notifications'), where('senderId', '==', uid));
      const notifSnap2 = await getDocs(notifQuery2);
      for (const d of notifSnap2.docs) {
        await deleteDoc(d.ref);
      }

      // 4. Delete user doc
      await deleteDoc(doc(db, 'users', uid));

      // 5. Delete auth user record
      await deleteUser(user);

      await logOut();
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Network connection error' };
    }
  };

  const updateBackendUrl = async (newUrl) => {
    console.log('Backend URL update requested, no-op under Firebase setup.');
  };

  const addCustomer = async (customer) => {
    const uid = auth.currentUser?.uid;
    const initialBal = customer.initialBalance ? parseFloat(customer.initialBalance) : 0;
    const computedBalance = customer.balanceType === 'gave' ? -initialBal : initialBal;

    if (uid) {
      try {
        const customerProfile = {
          name: customer.name,
          phone: customer.phone || '',
          type: customer.type || 'Regular',
          balance: computedBalance,
          userId: uid,
          pairedUserId: customer.pairedUserId || null,
          createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'customers'), customerProfile);
        const newCustomer = { id: docRef.id, ...customerProfile };

        if (initialBal !== 0) {
          await addDoc(collection(db, 'transactions'), {
            customerId: docRef.id,
            userId: uid,
            amount: initialBal,
            type: customer.balanceType || 'gave',
            note: 'Opening Balance',
            date: new Date().toISOString(),
            status: 'pending'
          });
        }
        
        return newCustomer;
      } catch (error) {
        console.error('Error syncing customer to Firestore:', error);
      }
    }

    // Local Fallback
    const localCustomer = { 
      ...customer, 
      id: Date.now().toString(), 
      balance: computedBalance 
    };
    const newCustomers = [...customers, localCustomer];
    setCustomers(newCustomers);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(newCustomers));

    if (initialBal !== 0) {
      const localTx = {
        id: 't_' + Date.now().toString(),
        customerId: localCustomer.id,
        amount: initialBal,
        type: customer.balanceType || 'gave',
        note: 'Opening Balance',
        date: new Date().toISOString(),
        status: 'pending'
      };
      const newTxs = [...transactions, localTx];
      setTransactions(newTxs);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTxs));
    }

    return localCustomer;
  };

  const addTransaction = async (transaction) => {
    const uid = auth.currentUser?.uid;

    if (uid) {
      try {
        const txProfile = {
          customerId: transaction.customerId,
          userId: uid,
          amount: parseFloat(transaction.amount),
          type: transaction.type,
          note: transaction.note || '',
          date: transaction.date || new Date().toISOString(),
          dueDate: transaction.dueDate || null,
          status: transaction.status || 'pending',
        };

        const docRef = await addDoc(collection(db, 'transactions'), txProfile);
        const newTx = { id: docRef.id, ...txProfile };

        const custDocRef = doc(db, 'customers', transaction.customerId);
        const diff = transaction.type === 'gave' ? -txProfile.amount : txProfile.amount;
        await updateDoc(custDocRef, {
          balance: increment(diff)
        });

        const customer = customers.find(c => c.id === transaction.customerId);
        if (customer && customer.pairedUserId) {
          await syncTransactionWithPeer(transaction.customerId, newTx);
        }

        return newTx;
      } catch (error) {
        console.error('Error syncing transaction to Firestore:', error);
      }
    }

    // Local Fallback
    const localTx = { ...transaction, id: Date.now().toString(), date: new Date().toISOString() };
    const newTransactions = [...transactions, localTx];
    setTransactions(newTransactions);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTransactions));

    const updatedCustomers = customers.map(c => {
      if (c.id === transaction.customerId) {
        let newBalance = c.balance;
        if (transaction.type === 'gave') newBalance -= transaction.amount;
        else newBalance += transaction.amount;
        return { ...c, balance: newBalance };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));

    return localTx;
  };

  const updateSettings = async (newSettings) => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        const userDocRef = doc(db, 'users', uid);
        const updatableFields = {};
        
        if (newSettings.businessName !== undefined) updatableFields.businessName = newSettings.businessName;
        if (newSettings.businessPhone !== undefined) updatableFields.businessPhone = newSettings.businessPhone;
        if (newSettings.businessAddress !== undefined) updatableFields.businessAddress = newSettings.businessAddress;
        if (newSettings.profileImage !== undefined) updatableFields.profileImage = newSettings.profileImage;
        if (newSettings.appLockPin !== undefined) updatableFields.appLockPin = newSettings.appLockPin;
        if (newSettings.isAppLockEnabled !== undefined) updatableFields.isAppLockEnabled = newSettings.isAppLockEnabled;
        if (newSettings.isBiometricEnabled !== undefined) updatableFields.isBiometricEnabled = newSettings.isBiometricEnabled;
        if (newSettings.paymentReminders !== undefined) updatableFields.paymentReminders = newSettings.paymentReminders;
        if (newSettings.dailySummary !== undefined) updatableFields.dailySummary = newSettings.dailySummary;
        if (newSettings.smsAlerts !== undefined) updatableFields.smsAlerts = newSettings.smsAlerts;
        if (newSettings.appUpdates !== undefined) updatableFields.appUpdates = newSettings.appUpdates;
        if (newSettings.reminderFrequency !== undefined) updatableFields.reminderFrequency = newSettings.reminderFrequency;

        await updateDoc(userDocRef, updatableFields);
        
        setSettings(prev => ({ ...prev, ...newSettings }));
        if (newSettings.appLockPin !== undefined) {
          setAppLockPin(newSettings.appLockPin);
          await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCK_PIN, newSettings.appLockPin);
        }
        if (newSettings.isAppLockEnabled !== undefined) {
          setIsAppLockEnabled(newSettings.isAppLockEnabled);
          await AsyncStorage.setItem(STORAGE_KEYS.IS_APP_LOCK_ENABLED, newSettings.isAppLockEnabled ? 'true' : 'false');
        }

        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...settings, ...newSettings }));
        return { ...settings, ...newSettings };
      } catch (error) {
        console.error('Error updating settings in Firestore:', error);
      }
    }

    // Offline update
    setSettings(newSettings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    return newSettings;
  };

  const submitSupportTicket = async (category, message) => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        await addDoc(collection(db, 'supportTickets'), {
          userId: uid,
          category,
          message,
          status: 'open',
          createdAt: new Date().toISOString()
        });
        return true;
      } catch (error) {
        console.error('Error submitting support ticket:', error);
        return false;
      }
    }
    return false;
  };

  const sendPairRequest = async (identifier) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, message: 'Internet connection required to pair users.' };
    const cleaned = identifier.trim();
    if (!cleaned) return { success: false, message: 'Please enter a valid email or phone number.' };

    const isEmail = cleaned.includes('@');
    const targetEmail = cleaned.toLowerCase();
    const targetPhoneNormal = cleaned.replace(/[^\d+]/g, '');

    try {
      let usersQuery;
      if (isEmail) {
        usersQuery = query(collection(db, 'users'), where('email', '==', targetEmail));
      } else {
        usersQuery = query(collection(db, 'users'), where('normalizedPhone', '==', targetPhoneNormal));
      }

      const userSnap = await getDocs(usersQuery);
      if (userSnap.empty) {
        return { success: false, message: 'User not found in system' };
      }
      const targetUserDoc = userSnap.docs[0];
      const targetUid = targetUserDoc.id;

      if (targetUid === uid) {
        return { success: false, message: 'You cannot pair with yourself' };
      }

      if (pairedUsers.includes(targetUid)) {
        return { success: false, message: 'You are already paired with this user' };
      }

      const pendingQuery = query(
        collection(db, 'notifications'),
        where('senderId', '==', uid),
        where('recipientId', '==', targetUid),
        where('type', '==', 'pair_request'),
        where('status', '==', 'pending')
      );
      const pendingSnap = await getDocs(pendingQuery);
      if (!pendingSnap.empty) {
        return { success: false, message: 'Pairing request is already pending' };
      }

      await addDoc(collection(db, 'notifications'), {
        recipientId: targetUid,
        senderId: uid,
        type: 'pair_request',
        status: 'pending',
        message: `${settings.businessName || auth.currentUser.email} sent you a connection request to link your ledgers.`,
        createdAt: new Date().toISOString()
      });

      return { success: true, message: 'Pairing request sent successfully!' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Server error occurred.' };
    }
  };

  const respondToNotification = async (notificationId, status) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return false;
    if (!['accepted', 'rejected'].includes(status)) return false;

    try {
      const notifDocRef = doc(db, 'notifications', notificationId);
      const notifDoc = await getDoc(notifDocRef);
      if (!notifDoc.exists()) return false;

      const notifData = notifDoc.data();
      if (notifData.status !== 'pending') return false;

      await updateDoc(notifDocRef, { status });

      const senderId = notifData.senderId;
      const recipientId = uid;

      const senderDoc = await getDoc(doc(db, 'users', senderId));
      const recipientDoc = await getDoc(doc(db, 'users', recipientId));

      const senderData = senderDoc.exists() ? senderDoc.data() : null;
      const recipientData = recipientDoc.exists() ? recipientDoc.data() : null;

      if (notifData.type === 'pair_request') {
        if (status === 'accepted') {
          await updateDoc(doc(db, 'users', recipientId), {
            pairedUsers: arrayUnion(senderId)
          });
          await updateDoc(doc(db, 'users', senderId), {
            pairedUsers: arrayUnion(recipientId)
          });

          await addDoc(collection(db, 'notifications'), {
            recipientId: senderId,
            senderId: recipientId,
            type: 'pair_accepted',
            status: 'viewed',
            message: `${recipientData?.businessName || recipientData?.email || 'A merchant'} accepted your pairing request! You can now sync credit ledgers.`,
            createdAt: new Date().toISOString()
          });
        }
      } else if (notifData.type === 'ledger_request') {
        const txData = notifData.data;
        const inverseType = txData.type === 'gave' ? 'got' : 'gave';

        if (status === 'accepted') {
          const customerQuery = query(
            collection(db, 'customers'),
            where('userId', '==', recipientId),
            where('pairedUserId', '==', senderId)
          );
          const customerSnap = await getDocs(customerQuery);
          let customerId = '';
          
          if (customerSnap.empty) {
            const newCustProfile = {
              userId: recipientId,
              name: senderData?.businessName || senderData?.email || 'Synced Peer',
              phone: senderData?.businessPhone || '',
              type: 'Regular',
              balance: 0,
              pairedUserId: senderId,
              createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, 'customers'), newCustProfile);
            customerId = docRef.id;
          } else {
            customerId = customerSnap.docs[0].id;
          }

          const newTxProfile = {
            customerId,
            userId: recipientId,
            amount: txData.amount,
            type: inverseType,
            note: `Synced peer entry: ${txData.note || 'None'}`,
            date: txData.date || new Date().toISOString(),
            status: 'completed'
          };
          await addDoc(collection(db, 'transactions'), newTxProfile);

          const diff = inverseType === 'gave' ? -txData.amount : txData.amount;
          await updateDoc(doc(db, 'customers', customerId), {
            balance: increment(diff)
          });

          await addDoc(collection(db, 'notifications'), {
            recipientId: senderId,
            senderId: recipientId,
            type: 'ledger_response',
            status: 'viewed',
            message: `${recipientData?.businessName || recipientData?.email || 'A merchant'} accepted your transaction entry of ${txData.amount} and added it to their ledger.`,
            data: { success: true },
            createdAt: new Date().toISOString()
          });
        } else {
          await addDoc(collection(db, 'notifications'), {
            recipientId: senderId,
            senderId: recipientId,
            type: 'ledger_response',
            status: 'viewed',
            message: `${recipientData?.businessName || recipientData?.email || 'A merchant'} rejected your transaction entry of ${txData.amount} as incorrect.`,
            data: { success: false },
            createdAt: new Date().toISOString()
          });
        }
      }

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const syncTransactionWithPeer = async (customerId, transaction) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const customerDoc = await getDoc(doc(db, 'customers', customerId));
      if (!customerDoc.exists()) return;

      const customer = customerDoc.data();
      if (!customer.pairedUserId) return;

      await addDoc(collection(db, 'notifications'), {
        recipientId: customer.pairedUserId,
        senderId: uid,
        type: 'ledger_request',
        status: 'pending',
        message: `${settings.businessName || auth.currentUser.email} added a ledger record: ${transaction.type === 'gave' ? 'lent/gave' : 'got/received'} ${transaction.amount}. Confirm to log?`,
        data: {
          amount: transaction.amount,
          type: transaction.type,
          note: transaction.note || '',
          date: transaction.date || new Date().toISOString(),
        },
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.log('Failed to sync transaction with peer automatically.', err);
    }
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
    let filtered = transactions.filter(t => 
      t.customerId === customerId
    );
    if (filter === 'gave') filtered = filtered.filter(t => t.type === 'gave');
    if (filter === 'got') filtered = filtered.filter(t => t.type === 'got');
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getTranslation = (key) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || key;
  };

  const getCurrencySymbol = () => {
    const matched = CURRENCIES.find(c => c.code === currency);
    return matched ? matched.symbol : '$';
  };

  const updateTransaction = async (transactionId, updatedFields, reason) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, message: 'Authentication required.' };

    try {
      const txDocRef = doc(db, 'transactions', transactionId);
      const txDocSnap = await getDoc(txDocRef);
      if (!txDocSnap.exists()) return { success: false, message: 'Transaction not found.' };

      const oldTx = txDocSnap.data();
      const customerId = oldTx.customerId;

      const newAmount = parseFloat(updatedFields.amount);
      const newType = updatedFields.type;
      const newNote = updatedFields.note || '';

      // Compute ledger adjustment
      // Old effect: if 'gave', we lent (decreased customer balance). If 'got', they paid (increased balance).
      const oldEffect = oldTx.type === 'gave' ? -oldTx.amount : oldTx.amount;
      // New effect:
      const newEffect = newType === 'gave' ? -newAmount : newAmount;

      const diff = newEffect - oldEffect;

      // Update customer balance atomically
      const custDocRef = doc(db, 'customers', customerId);
      await updateDoc(custDocRef, {
        balance: increment(diff)
      });

      // Log history
      const historyEntry = {
        editedAt: new Date().toISOString(),
        previousAmount: oldTx.amount,
        previousType: oldTx.type,
        previousNote: oldTx.note || '',
        reason: reason || 'No reason provided'
      };

      const historyList = oldTx.history || [];
      historyList.push(historyEntry);

      // Save updated fields to transaction doc
      await updateDoc(txDocRef, {
        amount: newAmount,
        type: newType,
        note: newNote,
        date: updatedFields.date || oldTx.date,
        history: historyList
      });

      // Sync notifications with peer if connected
      const customerDoc = await getDoc(custDocRef);
      if (customerDoc.exists() && customerDoc.data().pairedUserId) {
        await addDoc(collection(db, 'notifications'), {
          recipientId: customerDoc.data().pairedUserId,
          senderId: uid,
          type: 'ledger_request', // Resend request to sync update
          status: 'pending',
          message: `${settings.businessName || auth.currentUser.email} updated a ledger record to: ${newType === 'gave' ? 'gave' : 'got'} ${newAmount}. Reason: ${reason}. Confirm to sync?`,
          data: {
            amount: newAmount,
            type: newType,
            note: newNote,
            date: updatedFields.date || oldTx.date,
          },
          createdAt: new Date().toISOString()
        });
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating transaction:', err);
      return { success: false, message: err.message };
    }
  };

  const deleteTransaction = async (transactionId) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, message: 'Authentication required.' };

    try {
      const txDocRef = doc(db, 'transactions', transactionId);
      const txDocSnap = await getDoc(txDocRef);
      if (!txDocSnap.exists()) return { success: false, message: 'Transaction not found.' };

      const oldTx = txDocSnap.data();
      const customerId = oldTx.customerId;

      // Reverse ledger effect
      // Old effect: if 'gave', we lent (decreased customer balance). If 'got', they paid (increased balance).
      const oldEffect = oldTx.type === 'gave' ? -oldTx.amount : oldTx.amount;

      // Update customer balance atomically (subtract the old effect)
      const custDocRef = doc(db, 'customers', customerId);
      await updateDoc(custDocRef, {
        balance: increment(-oldEffect)
      });

      // Delete the transaction
      await deleteDoc(txDocRef);

      return { success: true };
    } catch (err) {
      console.error('Error deleting transaction:', err);
      return { success: false, message: err.message };
    }
  };

  return (
    <DataContext.Provider value={{
      customers,
      transactions,
      notifications,
      settings,
      backendUrl,
      isOnline,
      userRole,
      token,
      userEmail,
      language,
      currency,
      isOnboarded,
      appLockPin,
      isAppLockEnabled,
      isAppUnlocked,
      pairedUsers,
      setAppLockPin,
      setIsAppLockEnabled,
      setIsAppUnlocked,
      registerUser,
      loginUser,
      completeOnboarding,
      logOut,
      deleteAccountPermanently,
      addCustomer,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      updateSettings,
      submitSupportTicket,
      updateBackendUrl,
      getDueTransactions,
      getCustomerTransactions,
      syncWithServer,
      getTranslation,
      getCurrencySymbol,
      setLanguage,
      setCurrency,
      sendPairRequest,
      respondToNotification,
    }}>
      {children}
    </DataContext.Provider>
  );
};
