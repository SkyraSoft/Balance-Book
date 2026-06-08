import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';

export default function ReportsScreen() {
  const { customers, transactions } = useData();
  const totalGiven = transactions.filter(t => t.type === 'gave').reduce((s, t) => s + t.amount, 0);
  const totalReceived = transactions.filter(t => t.type === 'got').reduce((s, t) => s + t.amount, 0);
  const pending = totalGiven - totalReceived;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Given</Text>
          <Text style={styles.statAmount}>₹{totalGiven.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Received</Text>
          <Text style={styles.statAmount}>₹{totalReceived.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pending Amount</Text>
          <Text style={[styles.statAmount, { color: pending > 0 ? '#dc3545' : '#28a745' }]}>₹{pending.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Customers</Text>
          <Text style={styles.statAmount}>{customers.length}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.exportBtn}>
        <Icon name="file-download" size={20} color="#fff" />
        <Text style={styles.exportText}>Export Full Report (Excel/PDF)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { padding: 20, backgroundColor: '#2c7da0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#fff', marginBottom: 12, padding: 16, borderRadius: 12, elevation: 1, alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#666' },
  statAmount: { fontSize: 20, fontWeight: 'bold', marginTop: 8, color: '#333' },
  exportBtn: { flexDirection: 'row', backgroundColor: '#2c7da0', margin: 16, padding: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  exportText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
