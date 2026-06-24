import { isAfter, differenceInDays } from 'date-fns';

/**
 * Calculates a Behavioral Trust Score based on transaction history.
 * @param {Array} transactions 
 * @returns {number} Score from 0 to 100
 */
export const calculateTrustScore = (transactions) => {
  if (!transactions || transactions.length === 0) return 50; // Baseline for new connections

  let score = 50;
  
  // +1 for every valid transaction (up to 30 points)
  const confirmedCount = transactions.filter(t => t.status !== 'rejected').length;
  score += Math.min(30, confirmedCount);

  // -2 for every rejected transaction
  const rejectedCount = transactions.filter(t => t.status === 'rejected').length;
  score -= (rejectedCount * 2);

  // Analyze settlement behavior (did they pay back what they got?)
  // We can look at how many 'got' transactions exist vs 'gave'
  const gaveTxs = transactions.filter(t => t.type === 'gave');
  const gotTxs = transactions.filter(t => t.type === 'got');
  
  if (gaveTxs.length > 0 && gotTxs.length > 0) {
    score += 15; // Shows two-way settlement activity
  }

  // Ensure bounds
  return Math.max(0, Math.min(100, score));
};

/**
 * Predicts the average number of days it takes for a peer to settle a debt.
 * @param {Array} transactions 
 * @returns {string} Human readable prediction
 */
export const predictSettlement = (transactions) => {
  if (!transactions || transactions.length < 2) return "Not enough data to predict.";

  // Sort by date ascending
  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let balance = 0;
  let debtStartDate = null;
  const settlementDurations = [];

  for (const tx of sorted) {
    if (tx.status === 'rejected') continue;

    const diff = tx.type === 'gave' ? -tx.amount : tx.amount;
    const oldBalance = balance;
    balance += diff;

    // Transitioning into debt (user gave peer money, meaning peer owes user -> balance < 0)
    if (oldBalance >= 0 && balance < 0) {
      debtStartDate = new Date(tx.date);
    } 
    // Transitioning out of debt (peer paid back, balance >= 0)
    else if (oldBalance < 0 && balance >= 0 && debtStartDate) {
      const daysToSettle = differenceInDays(new Date(tx.date), debtStartDate);
      settlementDurations.push(daysToSettle);
      debtStartDate = null;
    }
  }

  if (settlementDurations.length === 0) {
    return "Usually settles immediately or data is insufficient.";
  }

  const avgDays = settlementDurations.reduce((sum, val) => sum + val, 0) / settlementDurations.length;
  
  if (avgDays < 1) return "Typically settles within a few hours.";
  return `Typically settles within ${Math.ceil(avgDays)} days.`;
};

/**
 * Detects if a new transaction amount is anomalously high compared to history.
 * @param {number} newAmount 
 * @param {Array} transactions 
 * @returns {object} { isAnomaly: boolean, avgAmount: number }
 */
export const detectAnomaly = (newAmount, transactions) => {
  if (!transactions || transactions.length < 3) return { isAnomaly: false, avgAmount: 0 };

  const validTxs = transactions.filter(t => t.status !== 'rejected');
  if (validTxs.length < 3) return { isAnomaly: false, avgAmount: 0 };

  const totalAmount = validTxs.reduce((sum, t) => sum + t.amount, 0);
  const avgAmount = totalAmount / validTxs.length;

  // Anomaly defined as 3x the average, with a minimum threshold to avoid triggering on small amounts
  const isAnomaly = newAmount > (avgAmount * 3) && newAmount > 50;

  return { isAnomaly, avgAmount };
};
