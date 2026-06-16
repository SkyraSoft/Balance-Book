import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { useData } from '../context/DataContext';

export default function TransactionItem({ transaction }) {
  const { getCurrencySymbol } = useData();
  const isGave = transaction.type === 'gave';

  const formatTxDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      // Format as e.g. "10 Jun 2026, 04:30 PM"
      const datePart = d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
      const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${datePart}, ${timePart}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.note}>{transaction.note || 'No description'}</Text>
        <Text style={styles.date}>{formatTxDate(transaction.date)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isGave ? COLORS.danger : COLORS.success }]}>
          {isGave ? `- ${getCurrencySymbol()}${transaction.amount.toLocaleString()}` : `+ ${getCurrencySymbol()}${transaction.amount.toLocaleString()}`}
        </Text>
        {transaction.attachment && (
          <TouchableOpacity style={styles.shareBtn}>
            <Icon name="receipt" size={16} color={COLORS.primary} />
            <Text style={styles.shareText}>RECEIPT</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: COLORS.white, 
    marginBottom: SIZES.sm, 
    padding: SIZES.md, 
    borderRadius: SIZES.radiusLg, 
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  left: { flex: 1, justifyContent: 'center' },
  note: { 
    fontSize: SIZES.fontMd, 
    fontWeight: '600', 
    color: COLORS.text,
    marginBottom: 4,
  },
  date: { 
    fontSize: SIZES.fontSm, 
    color: COLORS.textLight,
  },
  right: { alignItems: 'flex-end', justifyContent: 'center' },
  amount: { 
    fontSize: SIZES.fontLg, 
    fontWeight: 'bold',
  },
  shareBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: SIZES.xs,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radius,
  },
  shareText: { 
    fontSize: 10, 
    color: COLORS.primary, 
    marginLeft: 4,
    fontWeight: 'bold',
  },
});
