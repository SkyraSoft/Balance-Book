import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import CalendarView from '../components/CalendarView';

export default function HomeScreen() {
  const { getDueTransactions, customers } = useData();
  const { overdue, upcomingThisWeek, weekTotal, weekCount } = getDueTransactions();

  const handleRemind = (customerName) => {
    Alert.alert('Reminder Sent', `Reminder sent to ${customerName}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>BalanceBook</Text>
        <Text style={styles.tagline}>My Business Khata</Text>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Pending Collection this Week</Text>
        <Text style={styles.totalAmount}>₹{weekTotal.toLocaleString()}</Text>
        <Text style={styles.totalSub}>{weekCount} Payments</Text>
      </View>

      <CalendarView />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overdue</Text>
        {overdue.map(item => {
          const customer = customers.find(c => c.id === item.customerId);
          return (
            <View key={item.id} style={styles.duesCard}>
              <View>
                <Text style={styles.customerName}>{customer?.name || 'Unknown'}</Text>
                <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
                <Text style={styles.dueDate}>Due: {item.dueDate}</Text>
              </View>
              <TouchableOpacity style={styles.remindBtn} onPress={() => handleRemind(customer?.name)}>
                <Text style={styles.remindText}>Remind</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Dues</Text>
        {upcomingThisWeek.map(item => {
          const customer = customers.find(c => c.id === item.customerId);
          return (
            <View key={item.id} style={styles.duesCard}>
              <View>
                <Text style={styles.customerName}>{customer?.name || 'Unknown'}</Text>
                <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
                <Text style={styles.dueDate}>Due: {item.dueDate}</Text>
              </View>
              <TouchableOpacity style={styles.remindBtn} onPress={() => handleRemind(customer?.name)}>
                <Text style={styles.remindText}>Remind</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { padding: 20, backgroundColor: '#2c7da0', alignItems: 'center' },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  tagline: { fontSize: 14, color: '#d9e2e8', marginTop: 4 },
  totalCard: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16, elevation: 2, alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#666' },
  totalAmount: { fontSize: 36, fontWeight: 'bold', color: '#2c7da0', marginVertical: 8 },
  totalSub: { fontSize: 14, color: '#666' },
  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' },
  duesCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  customerName: { fontSize: 16, fontWeight: '500' },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#d9534f', marginTop: 4 },
  dueDate: { fontSize: 12, color: '#888', marginTop: 4 },
  remindBtn: { backgroundColor: '#f0ad4e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  remindText: { color: '#fff', fontWeight: '600' },
});
