const fs = require('fs');
const https = require('https');
const path = require('path');

const englishDict = {
    welcome: 'Welcome Back',
    loginSubtitle: 'Log in to manage your business ledger',
    email: 'Email Address',
    password: 'Password',
    signIn: 'Sign In',
    loggingIn: 'Logging in...',
    businessDashboard: 'Business Dashboard',
    totalIn: 'Total In',
    totalOut: 'Total Out',
    weeklySales: 'Weekly Ledger Trend',
    actualVsTarget: 'Actual vs Target',
    insights: 'Smart Business Insights',
    topDebtors: 'Top Debtors',
    topCreditors: 'Top Creditors',
    viewAll: 'View All',
    noDebtors: 'No debtors found.',
    noCreditors: 'No creditors found.',
    customers: 'Customers',
    searchCustomers: 'Search Customers',
    youllGet: "You'll Get",
    youllGive: "You'll Give",
    settled: 'Settled',
    addCustomer: 'Add Customer',
    importContacts: 'Add Customer from Contacts',
    customerName: 'Customer Name',
    mobileNumber: 'Mobile Number',
    openingBalance: 'Opening Balance (Optional)',
    saveCustomer: 'Add Customer',
    addTransaction: 'Add Transaction',
    saveEntry: 'SAVE ENTRY',
    amount: 'Amount',
    notePlaceholder: 'Enter Details (Item name, Bill No...)',
    category: 'Category Tag',
    date: 'Date',
    dueDate: 'Due Date',
    helpTitle: 'How can we help?',
    helpSubtitle: 'Find answers in our guides or contact support.',
    faq: 'Frequently Asked Questions',
    quickSupport: 'Quick Support',
    userGuide: 'User Guide',
    backupFaq: 'Backup FAQ',
    paymentIssues: 'Payment Issues',
    sendMessage: 'Send us a Message',
    writeMessage: 'Write your Message',
    submitMessage: 'Submit Message',
    settings: 'Settings',
    businessProfile: 'Business Profile',
    helpSupport: 'Help & Support',
    backupRestore: 'Backup & Restore',
    exportData: 'Export Data',
    notifications: 'Notifications',
    security: 'Security & App Lock',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    devApi: 'Developer: API Link',
    logout: 'Logout',
    currencySelect: 'Preferred Currency',
    langSelect: 'Preferred Language',
    completeSetup: 'Complete Setup',
    onboardingTitle1: 'Track Credits Simply',
    onboardingDesc1: 'Record credit given or cash received from your customers instantly.',
    onboardingTitle2: 'Auto Reminders',
    onboardingDesc2: 'Send polite automated repayment alerts via WhatsApp or SMS.',
    onboardingTitle3: 'Full-Stack Sync',
    onboardingDesc3: 'Your data is securely backed up and synced to the store admin web panel.',
    getStarted: 'Get Started',
    next: 'Next',
    repaymentProb: 'Repayment Probability',
    recommendation: 'Recommendation',
    predictCash: 'Smart Cash Flow Predictor',
    projectedInflow: 'Projected Inflow (Next 7 Days)',
    alertOverdue: 'overdue payments requiring attention',
    alertHighest: 'Highest collection this week',
    reminderBtn: 'Polite Reminder',
    dateFilter: 'Filter Date',
};

const top20Languages = [
  'en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'pt', 'ur', 
  'id', 'de', 'ja', 'sw', 'mr', 'te', 'tr', 'ta', 'vi', 'ko'
];

async function translateText(text, targetLang) {
  if (targetLang === 'en') return text;
  
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed[0][0][0]);
        } catch (e) {
          resolve(text); // Fallback to english if API fails
        }
      });
    }).on('error', (err) => {
      resolve(text);
    });
  });
}

async function buildTranslations() {
  console.log("Generating top 20 language translations...");
  const finalDict = {};
  
  for (const lang of top20Languages) {
    console.log(`Translating to ${lang}...`);
    finalDict[lang] = {};
    for (const [key, text] of Object.entries(englishDict)) {
      // Add slight delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
      const translated = await translateText(text, lang);
      finalDict[lang][key] = translated;
    }
  }

  const fileContent = `export const TRANSLATIONS = ${JSON.stringify(finalDict, null, 2)};\n`;
  const outPath = path.join(__dirname, '../src/utils/translations.js');
  fs.writeFileSync(outPath, fileContent, 'utf8');
  console.log('Translations generated and saved to ' + outPath);
}

buildTranslations();
