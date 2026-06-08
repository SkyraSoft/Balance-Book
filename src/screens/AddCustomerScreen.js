import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useData } from '../context/DataContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function AddCustomerScreen({ navigation }) {
  const { addCustomer } = useData();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState('');
  const [balanceType, setBalanceType] = useState('gave');

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill name and phone number');
      return;
    }
    let initialBalance = 0;
    if (balance) {
      const num = parseFloat(balance);
      if (!isNaN(num)) {
        initialBalance = balanceType === 'gave' ? -num : num;
      }
    }
    await addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      type: 'Regular',
      balance: initialBalance,
    });
    Alert.alert('Success', 'Customer added successfully');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.contactBtn}>
          <Icon name="contacts" size={24} color="#2c7da0" />
          <Text style={styles.contactText}>Add from Contacts</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Customer Full Name</Text>
        <TextInput style={styles.input} placeholder="e.g. John Doe" value={name} onChangeText={setName} />

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput style={styles.input} placeholder="+91 9876543210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Initial Balance (Optional)</Text>
        <View style={styles.balanceRow}>
          <TextInput
            style={[styles.input, styles.balanceInput]}
            placeholder="0.00"
            value={balance}
            onChangeText={setBalance}
            keyboardType="decimal-pad"
          />
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, balanceType === 'gave' && styles.typeBtnActive]}
              onPress={() => setBalanceType('gave')}
            >
              <Text style={[styles.typeText, balanceType === 'gave' && styles.typeTextActive]}>You Gave</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, balanceType === 'got' && styles.typeBtnActive]}
              onPress={() => setBalanceType('got')}
            >
              <Text style={[styles.typeText, balanceType === 'got' && styles.typeTextActive]}>You Got</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.hint}>Adding an initial balance helps you start tracking your ledger immediately.</Text>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Customer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16, elevation: 2 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2c7da0', borderRadius: 12, padding: 12, marginBottom: 20 },
  contactText: { color: '#2c7da0', fontWeight: '600', marginLeft: 8 },
  label: { fontSize: 14, fontWeight: '500', marginTop: 12, marginBottom: 6, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceInput: { flex: 1, marginRight: 12 },
  typeToggle: { flexDirection: 'row', backgroundColor: '#e9ecef', borderRadius: 30, padding: 2 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30 },
  typeBtnActive: { backgroundColor: '#2c7da0' },
  typeText: { color: '#666' },
  typeTextActive: { color: '#fff' },
  hint: { fontSize: 12, color: '#888', marginTop: 8 },
  saveBtn: { backgroundColor: '#2c7da0', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
