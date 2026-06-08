import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import TransactionItem from '../components/TransactionItem';

export default function CustomerDetailScreen({ route, navigation }) {
  const { customer } = route.params;
  const { getCustomerTransactions } = useData();
  const [filter, setFilter] = useState('all');
  const transactions = getCustomerTransactions(customer.id, filter);

  const getBalanceText = () => {
    if (customer.balance > 0) return `₹${customer.balance} You will get ↓`;
    if (customer.balance < 0) return `₹${Math.abs(customer.balance)} You will give ↑`;
    return `₹0 Settled`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.phone}>{customer.phone}</Text>
        <Text style={styles.type}>{customer.type} • Pays on Time</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Net Balance</Text>
          <Text style={[styles.balance, { color: customer.balance >= 0 ? '#28a745' : '#dc3545' }]}>
            {getBalanceText()}
          </Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {['all', 'gave', 'got'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f === 'all' ? 'All' : f === 'gave' ? 'You Gave' : 'You Got'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        ListEmptyComponent={<Text style={styles.empty}>No transactions</Text>}
      />

      <TouchableOpacity
        style={styles.addEntryBtn}
        onPress={() => navigation.navigate('AddEntry', { customerId: customer.id })}
      >
        <Icon name="add-circle" size={24} color="#fff" />
        <Text style={styles.addEntryText}>Add Entry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { backgroundColor: '#fff', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  name: { fontSize: 22, fontWeight: 'bold' },
  phone: { fontSize: 14, color: '#6c757d', marginTop: 4 },
  type: { fontSize: 12, color: '#888', marginTop: 4 },
  balanceCard: { marginTop: 16, alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: '#666' },
  balance: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  filterRow: { flexDirection: 'row', margin: 16, backgroundColor: '#fff', borderRadius: 30, padding: 4 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 30 },
  filterBtnActive: { backgroundColor: '#2c7da0' },
  filterBtnText: { color: '#666', fontWeight: '500' },
  filterBtnTextActive: { color: '#fff' },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
  addEntryBtn: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#2c7da0', flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, alignItems: 'center', elevation: 4 },
  addEntryText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
});
