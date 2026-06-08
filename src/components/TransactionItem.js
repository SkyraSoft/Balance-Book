import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function TransactionItem({ transaction }) {
  const isGave = transaction.type === 'gave';
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.note}>{transaction.note}</Text>
        <Text style={styles.date}>{transaction.date}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isGave ? '#dc3545' : '#28a745' }]}>
          {isGave ? `- ₹${transaction.amount}` : `+ ₹${transaction.amount}`}
        </Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Icon name="share" size={18} color="#2c7da0" />
          <Text style={styles.shareText}>SHARE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 6, padding: 14, borderRadius: 12, elevation: 1 },
  left: { flex: 1 },
  note: { fontSize: 15, fontWeight: '500' },
  date: { fontSize: 12, color: '#888', marginTop: 4 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: 'bold' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  shareText: { fontSize: 10, color: '#2c7da0', marginLeft: 4 },
});
