import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import { useNavigation } from '@react-navigation/native';

export default function CustomersScreen() {
  const { customers } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const navigation = useNavigation();

  const filters = ['All', 'VIP', 'Wholesale', 'Regular', 'Risky'];

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesFilter = filter === 'All' || c.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getBalanceText = (balance) => {
    if (balance > 0) return `You will get ₹${balance}`;
    if (balance < 0) return `You will give ₹${Math.abs(balance)}`;
    return `Settled ₹0`;
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return '#28a745';
    if (balance < 0) return '#dc3545';
    return '#6c757d';
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredCustomers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.customerCard}
            onPress={() => navigation.navigate('CustomerDetail', { customer: item })}
          >
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.name}</Text>
              <Text style={styles.customerType}>{item.type}</Text>
              <Text style={styles.customerPhone}>{item.phone}</Text>
            </View>
            <View style={styles.balanceContainer}>
              <Text style={[styles.balance, { color: getBalanceColor(item.balance) }]}>
                {getBalanceText(item.balance)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddCustomer')}
          >
            <Icon name="person-add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Customer</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, paddingHorizontal: 12, borderRadius: 10, elevation: 1 },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 16 },
  filterRow: { paddingHorizontal: 12, marginBottom: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#e9ecef', borderRadius: 20, marginHorizontal: 4 },
  filterChipActive: { backgroundColor: '#2c7da0' },
  filterText: { color: '#495057' },
  filterTextActive: { color: '#fff' },
  customerCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '600' },
  customerType: { fontSize: 12, color: '#6c757d', marginTop: 2 },
  customerPhone: { fontSize: 12, color: '#888', marginTop: 2 },
  balance: { fontSize: 14, fontWeight: '600' },
  addButton: { flexDirection: 'row', backgroundColor: '#2c7da0', margin: 16, padding: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
