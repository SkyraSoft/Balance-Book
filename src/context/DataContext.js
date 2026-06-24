import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfWeek, endOfWeek, isWithinInterval, isBefore } from 'date-fns';
import { TRANSLATIONS } from '../utils/translations';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { CURRENCIES } from '../utils/currencies';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, onSnapshot, addDoc, arrayUnion, increment } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
  
  // Workspaces (Business Ledgers)
  const [activeWorkspace, setActiveWorkspace] = useState('personal'); // 'personal' or { id, name, role }
  const [userWorkspaces, setUserWorkspaces] = useState([]); // Array of business objects
  
  // App Lock security state
  const [appLockPin, setAppLockPin] = useState('');
  const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);

  // App CMS Content
  const [globalContent, setGlobalContent] = useState({
    helpEmail: 'support@balancebook.app',
    helpPhone: '+1-800-BALANCE',
    helpIntro: 'Having issues with your ledger? Contact our global support team available 24/7.',
    termsText: '1. Introduction\nWelcome to Balance Book. By using this application...',
    privacyText: '1. Data Collection\nWe collect basic account metadata...',
    userGuide: '# Balance Book User Guide\n\nWelcome to your complete ledger manual. You can manage customers, sync cross-border, and track cashflow.',
  });

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
    let unsubscribeNotifications = () => {};
    let unsubscribeUser = () => {};
    let unsubscribeGlobal = () => {};
    let unsubscribeBusinesses = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeNotifications();
      unsubscribeUser();
      unsubscribeGlobal();
      unsubscribeBusinesses();

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

        // 2. Listen to businesses the user is part of
        const bizQuery = query(collection(db, 'businesses'), where('memberIds', 'array-contains', uid));
        unsubscribeBusinesses = onSnapshot(bizQuery, (querySnap) => {
          const fetchedBiz = [];
          querySnap.forEach((doc) => {
            fetchedBiz.push({ id: doc.id, ...doc.data() });
          });
          setUserWorkspaces(fetchedBiz);
        });

        // 3. Listen to notifications
        const notificationsQuery = query(
          collection(db, 'notifications'), 
          where('recipientId', '==', uid)
        );
        unsubscribeNotifications = onSnapshot(notificationsQuery, async (querySnap) => {
          querySnap.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (data.createdAt) {
                const createdAt = new Date(data.createdAt);
                // Trigger local notification if created in the last 10 seconds
                if (new Date() - createdAt < 10000 && !data.isRead) {
                  Notifications.scheduleNotificationAsync({
                    content: { title: 'New Alert', body: data.message },
                    trigger: null,
                  });
                }
              }
            }
          });

          const fetchedNotifs = [];
          for (const d of querySnap.docs) {
            const notif = { _id: d.id, ...d.data() };
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

        // 4. Listen to Global Content CMS
        const globalDocRef = doc(db, 'appContent', 'global');
        unsubscribeGlobal = onSnapshot(globalDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setGlobalContent(prev => ({ ...prev, ...docSnap.data() }));
          } else {
            console.log("No global content found, using defaults");
          }
        });
      } else {
        setToken(null);
        setUserEmail('');
        setUserRole(null);
        setCustomers([]);
        setTransactions([]);
        setNotifications([]);
        setUserWorkspaces([]);
        setActiveWorkspace('personal');
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeNotifications();
      unsubscribeUser();
      unsubscribeGlobal();
      unsubscribeBusinesses();
    };
  }, [userRole]);

  // Context-aware Customers and Transactions Listener
  useEffect(() => {
    let unsubscribeCustomers = () => {};
    let unsubscribeTransactions = () => {};

    if (token) {
      if (activeWorkspace === 'personal') {
        const customersQuery = query(collection(db, 'customers'), where('userId', '==', token));
        unsubscribeCustomers = onSnapshot(customersQuery, async (querySnap) => {
          const fetchedCustomers = [];
          querySnap.forEach((doc) => {
            fetchedCustomers.push({ id: doc.id, ...doc.data() });
          });
          setCustomers(fetchedCustomers);
          await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(fetchedCustomers));
        });

        const transactionsQuery = query(collection(db, 'transactions'), where('userId', '==', token));
        unsubscribeTransactions = onSnapshot(transactionsQuery, async (querySnap) => {
          const fetchedTxs = [];
          querySnap.forEach((doc) => {
            fetchedTxs.push({ id: doc.id, ...doc.data() });
          });
          setTransactions(fetchedTxs);
          await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(fetchedTxs));
        });
      } else {
        // Business Workspace
        const bizId = activeWorkspace.id;
        const customersQuery = query(collection(db, 'businesses', bizId, 'customers'));
        unsubscribeCustomers = onSnapshot(customersQuery, (querySnap) => {
          const fetchedCustomers = [];
          querySnap.forEach((doc) => {
            fetchedCustomers.push({ id: doc.id, ...doc.data() });
          });
          setCustomers(fetchedCustomers);
        });

        const transactionsQuery = query(collection(db, 'businesses', bizId, 'transactions'));
        unsubscribeTransactions = onSnapshot(transactionsQuery, (querySnap) => {
          const fetchedTxs = [];
          querySnap.forEach((doc) => {
            fetchedTxs.push({ id: doc.id, ...doc.data() });
          });
          setTransactions(fetchedTxs);
        });
      }
    }

    return () => {
      unsubscribeCustomers();
      unsubscribeTransactions();
    };
  }, [token, activeWorkspace]);

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
        setIsAppLockEnabled(false);
        setIsAppUnlocked(true);
      }
      
      // Request Push Notification Permissions
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
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

  const loginUser = async (identifier, password) => {
    try {
      let emailToLogin = identifier.toLowerCase().trim();
      
      // Check if it's a phone number (contains mostly digits and optional '+')
      const isPhone = /^\+?[\d\s-]+$/.test(identifier) && identifier.replace(/[^\d]/g, '').length >= 10;
      
      if (isPhone) {
        // Global Normalization: Extract the last 10 digits for a robust global search key
        const phoneSearchKey = identifier.replace(/\D/g, '').slice(-10);
        
        // Find email by phoneSearchKey
        const usersQuery = query(collection(db, 'users'), where('phoneSearchKey', '==', phoneSearchKey));
        const usersSnap = await getDocs(usersQuery);
        
        if (!usersSnap.empty) {
          emailToLogin = usersSnap.docs[0].data().email;
        } else {
          return { success: false, message: 'Phone number not registered' };
        }
      }

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
      } catch (err) {
        // Auto-create demo Admin account if it doesn't exist
        if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') && 
            (emailToLogin === 'admin@balancebook.com')) {
          userCredential = await createUserWithEmailAndPassword(auth, emailToLogin, password);
          const role = 'admin';
          const uid = userCredential.user.uid;
          await setDoc(doc(db, 'users', uid), {
            email: emailToLogin,
            role,
            businessName: 'Application Owner',
            businessPhone: '+923011175678',
            normalizedPhone: '+923011175678',
            phoneSearchKey: '3011175678',
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
          email: emailToLogin,
          role: 'user',
          businessName: 'Balance Book Merchant',
          businessPhone: '',
          normalizedPhone: '',
          phoneSearchKey: '',
          createdAt: new Date().toISOString(),
          dailyActiveSeconds: 0,
          lastActiveTime: new Date().toISOString(),
          pairedUsers: [],
        });
      }

      setUserRole(role);
      setUserEmail(emailToLogin);
      setToken(uid);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, emailToLogin);

      return { success: true, role };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Invalid email or password' };
    }
  };

  const registerUser = async (email, password, businessName, businessPhone, businessAddress) => {
    try {
      const sanitizedEmail = email.toLowerCase().trim();
      const normalizedPhone = businessPhone ? businessPhone.replace(/[^\d+]/g, '') : '';
      const phoneSearchKey = businessPhone ? businessPhone.replace(/\D/g, '').slice(-10) : '';
      
      // Prevent duplicate accounts on the same phone using the global search key
      if (phoneSearchKey) {
        const usersQuery = query(collection(db, 'users'), where('phoneSearchKey', '==', phoneSearchKey));
        const usersSnap = await getDocs(usersQuery);
        if (!usersSnap.empty) {
          return { success: false, message: 'Phone number already registered to another account' };
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
      const uid = userCredential.user.uid;

      const userProfile = {
        email: sanitizedEmail,
        role: 'user',
        businessName: businessName || 'Balance Book Merchant',
        businessPhone: businessPhone || '',
        normalizedPhone: normalizedPhone,
        phoneSearchKey: phoneSearchKey,
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

      // Notify merchants that this user has joined
      if (normalizedPhone) {
        try {
          const custQuery = query(collection(db, 'customers'), where('normalizedPhone', '==', normalizedPhone));
          const custSnap = await getDocs(custQuery);
          
          if (!custSnap.empty) {
            const merchantsToNotify = new Set();
            custSnap.forEach(d => {
              const data = d.data();
              if (data.userId && data.userId !== uid) {
                merchantsToNotify.add(data.userId);
              }
            });

            for (const merchantId of merchantsToNotify) {
              await addDoc(collection(db, 'notifications'), {
                recipientId: merchantId,
                senderId: uid,
                type: 'alert',
                status: 'unread',
                message: `${businessName || 'A new user'} you do business with has joined BalanceBook! Pair with them now.`,
                createdAt: new Date().toISOString()
              });
            }
          }
        } catch (err) {
          console.error('Failed to send registration notifications:', err);
        }
      }

      return { success: true, role: 'user' };
    } catch (error) {
      console.error(error);
      let message = error.message || 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email address is already in use by another account.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'The email address is not valid.';
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
    const phoneSearchKey = businessProfile.phone ? businessProfile.phone.replace(/\D/g, '').slice(-10) : '';

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
          phoneSearchKey: phoneSearchKey,
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

        // Retroactive Pair Notifications
        if (normalizedPhone) {
          const customersQuery = query(
            collection(db, 'customers'), 
            where('normalizedPhone', '==', normalizedPhone)
          );
          const customersSnap = await getDocs(customersQuery);
          
          for (const custDoc of customersSnap.docs) {
            const custData = custDoc.data();
            if (custData.userId !== uid && !custData.pairedUserId) {
              // Check if pair_request already pending
              const pendingQuery = query(
                collection(db, 'notifications'),
                where('senderId', '==', uid),
                where('recipientId', '==', custData.userId),
                where('type', '==', 'pair_request'),
                where('status', '==', 'pending')
              );
              const pendingSnap = await getDocs(pendingQuery);
              
              if (pendingSnap.empty) {
                await addDoc(collection(db, 'notifications'), {
                  recipientId: custData.userId,
                  senderId: uid,
                  type: 'pair_request',
                  status: 'pending',
                  message: `Your customer with phone ${businessProfile.phone} just joined Balance Book! Do you want to sync your ledger with them?`,
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        }
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

      // 4. Remove pairedUserId from other users' customers
      const pairedCustQuery = query(collection(db, 'customers'), where('pairedUserId', '==', uid));
      const pairedCustSnap = await getDocs(pairedCustQuery);
      for (const d of pairedCustSnap.docs) {
        await updateDoc(d.ref, { pairedUserId: null });
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
        const normalizedCustomerPhone = customer.phone ? customer.phone.replace(/[^\d+]/g, '') : '';
        const customerProfile = {
          name: customer.name,
          phone: customer.phone || '',
          normalizedPhone: normalizedCustomerPhone,
          type: customer.type || 'Regular',
          balance: computedBalance,
          userId: uid,
          pairedUserId: customer.pairedUserId || null,
          createdAt: new Date().toISOString()
        };

        let custCollectionRef = collection(db, 'customers');
        let txCollectionRef = collection(db, 'transactions');

        if (activeWorkspace !== 'personal') {
          custCollectionRef = collection(db, 'businesses', activeWorkspace.id, 'customers');
          txCollectionRef = collection(db, 'businesses', activeWorkspace.id, 'transactions');
        }

        const docRef = await addDoc(custCollectionRef, customerProfile);
        const newCustomer = { id: docRef.id, ...customerProfile };

        if (initialBal !== 0) {
          await addDoc(txCollectionRef, {
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
        const customer = customers.find(c => c.id === transaction.customerId);
        const isPaired = customer && customer.pairedUserId;

        const txProfile = {
          customerId: transaction.customerId,
          userId: uid,
          amount: parseFloat(transaction.amount),
          type: transaction.type,
          note: transaction.note || '',
          description: transaction.description || '',
          date: transaction.date || new Date().toISOString(),
          dueDate: transaction.dueDate || null,
          status: isPaired ? 'pending_peer_approval' : (transaction.status || 'confirmed'),
        };

        let txCollectionRef = collection(db, 'transactions');
        let custDocRef = doc(db, 'customers', transaction.customerId);
        
        if (activeWorkspace !== 'personal') {
          txCollectionRef = collection(db, 'businesses', activeWorkspace.id, 'transactions');
          custDocRef = doc(db, 'businesses', activeWorkspace.id, 'customers', transaction.customerId);
        }

        const docRef = await addDoc(txCollectionRef, txProfile);
        const newTx = { id: docRef.id, ...txProfile };

        if (!isPaired) {
          const diff = transaction.type === 'gave' ? -txProfile.amount : txProfile.amount;
          await updateDoc(custDocRef, {
            balance: increment(diff)
          });
        } else {
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
        
        // Profile Editing expansions
        if (newSettings.country !== undefined) updatableFields.country = newSettings.country;
        if (newSettings.businessType !== undefined) updatableFields.businessType = newSettings.businessType;
        if (newSettings.currency !== undefined) {
          updatableFields.currency = newSettings.currency;
          setCurrency(newSettings.currency);
          await AsyncStorage.setItem(STORAGE_KEYS.CURRENCY, newSettings.currency);
        }
        if (newSettings.language !== undefined) {
          updatableFields.language = newSettings.language;
          setLanguage(newSettings.language);
          await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, newSettings.language);
        }

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

  const markNotificationsAsRead = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const unreadNotifs = notifications.filter(n => !n.isRead);
      for (const notif of unreadNotifs) {
        if (notif._id) {
          const notifRef = doc(db, 'notifications', notif._id);
          await updateDoc(notifRef, { isRead: true });
        }
      }
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
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
        const searchKey = targetPhoneNormal.slice(-10);
        usersQuery = query(collection(db, 'users'), where('phoneSearchKey', '==', searchKey));
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
        currency: currency, // sender's local currency
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

          // 1. Link or create Customer docs
          let customerForSender = null;
          let customerForRecipient = null;

          // Find A's record of B (sender's record of recipient)
          const senderCustQuery = query(collection(db, 'customers'), where('userId', '==', senderId), where('pairedUserId', '==', recipientId));
          const senderCustSnap = await getDocs(senderCustQuery);
          if (!senderCustSnap.empty) customerForSender = senderCustSnap.docs[0].id;
          else {
             const senderCustPhoneQuery = query(collection(db, 'customers'), where('userId', '==', senderId), where('normalizedPhone', '==', recipientData?.normalizedPhone || '___'));
             const scpSnap = await getDocs(senderCustPhoneQuery);
             if (!scpSnap.empty) {
               customerForSender = scpSnap.docs[0].id;
               await updateDoc(doc(db, 'customers', customerForSender), { pairedUserId: recipientId });
             } else {
               const ref = await addDoc(collection(db, 'customers'), {
                 userId: senderId,
                 pairedUserId: recipientId,
                 name: recipientData?.businessName || recipientData?.email || 'Peer Merchant',
                 phone: recipientData?.businessPhone || '',
                 normalizedPhone: recipientData?.normalizedPhone || '',
                 type: 'Regular',
                 balance: 0,
                 peerCurrency: currency, // The recipient's local currency
                 createdAt: new Date().toISOString()
               });
               customerForSender = ref.id;
             }
          }

          // Find B's record of A (recipient's record of sender)
          const recCustQuery = query(collection(db, 'customers'), where('userId', '==', recipientId), where('pairedUserId', '==', senderId));
          const recCustSnap = await getDocs(recCustQuery);
          if (!recCustSnap.empty) customerForRecipient = recCustSnap.docs[0].id;
          else {
             const recCustPhoneQuery = query(collection(db, 'customers'), where('userId', '==', recipientId), where('normalizedPhone', '==', senderData?.normalizedPhone || '___'));
             const rcpSnap = await getDocs(recCustPhoneQuery);
             if (!rcpSnap.empty) {
               customerForRecipient = rcpSnap.docs[0].id;
               await updateDoc(doc(db, 'customers', customerForRecipient), { pairedUserId: senderId });
             } else {
               const ref = await addDoc(collection(db, 'customers'), {
                 userId: recipientId,
                 pairedUserId: senderId,
                 name: senderData?.businessName || senderData?.email || 'Peer Merchant',
                 phone: senderData?.businessPhone || '',
                 normalizedPhone: senderData?.normalizedPhone || '',
                 type: 'Regular',
                 balance: 0,
                 peerCurrency: notifData.currency || 'USD', // The sender's local currency
                 createdAt: new Date().toISOString()
               });
               customerForRecipient = ref.id;
             }
          }

          // 2. Merge Histories (Copy A's txs to B, and B's txs to A)
          const senderTxsQuery = query(collection(db, 'transactions'), where('userId', '==', senderId), where('customerId', '==', customerForSender));
          const senderTxsSnap = await getDocs(senderTxsQuery);
          const senderTxs = senderTxsSnap.docs.map(d => d.data());

          const recTxsQuery = query(collection(db, 'transactions'), where('userId', '==', recipientId), where('customerId', '==', customerForRecipient));
          const recTxsSnap = await getDocs(recTxsQuery);
          const recTxs = recTxsSnap.docs.map(d => d.data());

          // Sync A to B
          for (const tx of senderTxs) {
            const exists = recTxs.find(r => r.date === tx.date && r.amount === tx.amount && r.note === tx.note);
            if (!exists) {
              const invType = tx.type === 'gave' ? 'got' : 'gave';
              await addDoc(collection(db, 'transactions'), {
                userId: recipientId,
                customerId: customerForRecipient,
                amount: tx.amount,
                type: invType,
                note: tx.note,
                date: tx.date,
                status: 'confirmed'
              });
              const diff = invType === 'gave' ? -tx.amount : tx.amount;
              await updateDoc(doc(db, 'customers', customerForRecipient), { balance: increment(diff) });
            }
          }

          // Sync B to A
          for (const tx of recTxs) {
            const exists = senderTxs.find(r => r.date === tx.date && r.amount === tx.amount && r.note === tx.note);
            if (!exists) {
              const invType = tx.type === 'gave' ? 'got' : 'gave';
              await addDoc(collection(db, 'transactions'), {
                userId: senderId,
                customerId: customerForSender,
                amount: tx.amount,
                type: invType,
                note: tx.note,
                date: tx.date,
                status: 'confirmed'
              });
              const diff = invType === 'gave' ? -tx.amount : tx.amount;
              await updateDoc(doc(db, 'customers', customerForSender), { balance: increment(diff) });
            }
          }

          await addDoc(collection(db, 'notifications'), {
            recipientId: senderId,
            senderId: recipientId,
            type: 'pair_accepted',
            status: 'viewed',
            message: `${recipientData?.businessName || recipientData?.email || 'A merchant'} accepted your pairing request! Your ledgers are now synced.`,
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

          const txAction = txData.action || 'create';

          if (txAction === 'create') {
            const newTxProfile = {
              customerId,
              userId: recipientId,
              amount: txData.amount,
              type: inverseType,
              note: `Synced peer entry: ${txData.note || 'None'}`,
              description: txData.description || '',
              date: txData.date || new Date().toISOString(),
              status: 'confirmed',
              pairedTransactionId: txData.originalTransactionId,
              originalCurrency: txData.originalCurrency || null,
              originalAmount: txData.originalAmount || null,
              exchangeRate: txData.exchangeRate || null
            };
            await addDoc(collection(db, 'transactions'), newTxProfile);

            const diff = inverseType === 'gave' ? -txData.amount : txData.amount;
            await updateDoc(doc(db, 'customers', customerId), {
              balance: increment(diff)
            });
          } else if (txAction === 'update' || txAction === 'delete') {
            const existingTxQuery = query(
              collection(db, 'transactions'),
              where('userId', '==', recipientId),
              where('pairedTransactionId', '==', txData.originalTransactionId)
            );
            const existingTxSnap = await getDocs(existingTxQuery);
            if (!existingTxSnap.empty) {
              const txToUpdateRef = existingTxSnap.docs[0].ref;
              const oldData = existingTxSnap.docs[0].data();
              const oldEffect = oldData.type === 'gave' ? -oldData.amount : oldData.amount;

              if (txAction === 'update') {
                const newEffect = inverseType === 'gave' ? -txData.amount : txData.amount;
                const diff = newEffect - oldEffect;
                
                await updateDoc(txToUpdateRef, {
                  amount: txData.amount,
                  type: inverseType,
                  note: `Synced peer entry: ${txData.note || 'None'}`,
                  description: txData.description || '',
                  date: txData.date || oldData.date
                });

                await updateDoc(doc(db, 'customers', customerId), {
                  balance: increment(diff)
                });
              } else if (txAction === 'delete') {
                await deleteDoc(txToUpdateRef);
                await updateDoc(doc(db, 'customers', customerId), {
                  balance: increment(-oldEffect)
                });
              }
            }
          }

          if (txData.originalTransactionId) {
            try {
              let origTxRef = doc(db, 'transactions', txData.originalTransactionId);
              if (txData.businessId) {
                origTxRef = doc(db, 'businesses', txData.businessId, 'transactions', txData.originalTransactionId);
              }
              const origTxSnap = await getDoc(origTxRef);
              if (origTxSnap.exists()) {
                await updateDoc(origTxRef, { status: 'confirmed' });
                const origData = origTxSnap.data();
                
                let origCustRef = doc(db, 'customers', origData.customerId);
                if (txData.businessId) {
                  origCustRef = doc(db, 'businesses', txData.businessId, 'customers', origData.customerId);
                }
                const origDiff = origData.type === 'gave' ? -origData.amount : origData.amount;
                await updateDoc(origCustRef, { balance: increment(origDiff) });
              }
            } catch (e) {
              console.error('Failed to update original transaction:', e);
            }
          }

          const actionMsg = txAction === 'create' ? 'record' : (txAction === 'update' ? 'update' : 'deletion');
          await addDoc(collection(db, 'notifications'), {
            recipientId: senderId,
            senderId: recipientId,
            type: 'ledger_response',
            status: 'viewed',
            message: `${recipientData?.businessName || recipientData?.email || 'A merchant'} accepted and synced your ${actionMsg} of ${txData.amount}.`,
            createdAt: new Date().toISOString()
          });
        } else if (status === 'rejected') {
          if (txData.originalTransactionId) {
            try {
              let origTxRef = doc(db, 'transactions', txData.originalTransactionId);
              if (txData.businessId) {
                origTxRef = doc(db, 'businesses', txData.businessId, 'transactions', txData.originalTransactionId);
              }
              await updateDoc(origTxRef, { status: 'rejected' });
            } catch (e) {}
          }
          const actionMsg = txData.action === 'create' ? 'record' : (txData.action === 'update' ? 'update' : 'deletion');
          await addDoc(collection(db, 'notifications'), {
            recipientId: senderId,
            senderId: recipientId,
            type: 'ledger_response',
            status: 'viewed',
            message: `${recipientData?.businessName || recipientData?.email || 'A merchant'} rejected your ledger ${actionMsg} of ${txData.amount}.`,
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

      let finalAmount = transaction.amount;
      let conversionMeta = {};

      if (customer.peerCurrency && customer.peerCurrency !== currency) {
        try {
          const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
          const data = await res.json();
          if (data && data.rates && data.rates[customer.peerCurrency]) {
            const rate = data.rates[customer.peerCurrency];
            finalAmount = Number((transaction.amount * rate).toFixed(2));
            conversionMeta = {
              originalAmount: transaction.amount,
              originalCurrency: currency,
              exchangeRate: rate
            };
          }
        } catch (e) {
          console.log('Currency conversion failed', e);
        }
      }

      const senderIdentity = activeWorkspace === 'personal' 
        ? (settings.businessName || auth.currentUser.email) 
        : `${auth.currentUser.email} from ${activeWorkspace.name}`;

      await addDoc(collection(db, 'notifications'), {
        recipientId: customer.pairedUserId,
        senderId: uid,
        type: 'ledger_request',
        status: 'pending',
        message: `${senderIdentity} added a ledger record: ${transaction.type === 'gave' ? 'lent/gave' : 'got/received'} ${finalAmount} ${customer.peerCurrency || currency}. Confirm to log?`,
        data: {
          action: 'create',
          originalTransactionId: transaction.id || transaction._id,
          amount: finalAmount,
          ...conversionMeta,
          type: transaction.type,
          note: transaction.note || '',
          description: transaction.description || '',
          date: transaction.date || new Date().toISOString(),
          businessId: activeWorkspace !== 'personal' ? activeWorkspace.id : null,
          businessName: activeWorkspace !== 'personal' ? activeWorkspace.name : null,
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
      let txDocRef = doc(db, 'transactions', transactionId);
      if (activeWorkspace !== 'personal') {
        txDocRef = doc(db, 'businesses', activeWorkspace.id, 'transactions', transactionId);
      }
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
      let custDocRef = doc(db, 'customers', customerId);
      if (activeWorkspace !== 'personal') {
        custDocRef = doc(db, 'businesses', activeWorkspace.id, 'customers', customerId);
      }
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
        const senderIdentity = activeWorkspace === 'personal' 
          ? (settings.businessName || auth.currentUser.email) 
          : `${auth.currentUser.email} from ${activeWorkspace.name}`;

        await addDoc(collection(db, 'notifications'), {
          recipientId: customerDoc.data().pairedUserId,
          senderId: uid,
          type: 'ledger_request', // Resend request to sync update
          status: 'pending',
          message: `${senderIdentity} updated a ledger record to: ${newType === 'gave' ? 'gave' : 'got'} ${newAmount}. Reason: ${reason}. Confirm to sync?`,
          data: {
            action: 'update',
            originalTransactionId: transactionId,
            amount: newAmount,
            type: newType,
            note: newNote,
            description: updatedFields.description || '',
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
      let txDocRef = doc(db, 'transactions', transactionId);
      if (activeWorkspace !== 'personal') {
        txDocRef = doc(db, 'businesses', activeWorkspace.id, 'transactions', transactionId);
      }
      const txDocSnap = await getDoc(txDocRef);
      if (!txDocSnap.exists()) return { success: false, message: 'Transaction not found.' };

      const oldTx = txDocSnap.data();
      const customerId = oldTx.customerId;

      // Reverse ledger effect
      // Old effect: if 'gave', we lent (decreased customer balance). If 'got', they paid (increased balance).
      const oldEffect = oldTx.type === 'gave' ? -oldTx.amount : oldTx.amount;

      // Update customer balance atomically (subtract the old effect)
      let custDocRef = doc(db, 'customers', customerId);
      if (activeWorkspace !== 'personal') {
        custDocRef = doc(db, 'businesses', activeWorkspace.id, 'customers', customerId);
      }
      await updateDoc(custDocRef, {
        balance: increment(-oldEffect)
      });

      // Delete the transaction
      await deleteDoc(txDocRef);

      // Sync notifications with peer if connected
      const customerDoc = await getDoc(custDocRef);
      if (customerDoc.exists() && customerDoc.data().pairedUserId) {
        const senderIdentity = activeWorkspace === 'personal' 
          ? (settings.businessName || auth.currentUser.email) 
          : `${auth.currentUser.email} from ${activeWorkspace.name}`;

        await addDoc(collection(db, 'notifications'), {
          recipientId: customerDoc.data().pairedUserId,
          senderId: uid,
          type: 'ledger_request',
          status: 'pending',
          message: `${senderIdentity} deleted a ledger record (${oldTx.type === 'gave' ? 'gave' : 'got'} ${oldTx.amount}). Confirm to sync deletion?`,
          data: {
            action: 'delete',
            originalTransactionId: transactionId,
            amount: oldTx.amount,
            type: oldTx.type,
            note: oldTx.note || '',
            description: oldTx.description || '',
            date: oldTx.date,
          },
          createdAt: new Date().toISOString()
        });
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting transaction:', err);
      return { success: false, message: err.message };
    }
  };

  const updateGlobalContent = async (newContent) => {
    try {
      if (!isOnline) return { success: false, message: 'Cannot update content while offline.' };
      if (userRole !== 'admin') return { success: false, message: 'Unauthorized.' };
      const docRef = doc(db, 'appContent', 'global');
      await updateDoc(docRef, newContent);
      return { success: true };
    } catch (error) {
      console.error('Error updating global content:', error);
      return { success: false, message: error.message };
    }
  };

  return (
    <DataContext.Provider value={{
      globalContent,
      updateGlobalContent,
      customers,
      transactions,
      notifications,
      activeWorkspace,
      setActiveWorkspace,
      userWorkspaces,
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
      markNotificationsAsRead,
    }}>
      {children}
    </DataContext.Provider>
  );
};
