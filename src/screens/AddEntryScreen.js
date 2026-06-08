import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useData } from '../context/DataContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function AddEntryScreen({ route, navigation }) {
  const { customerId } = route.params;
  const { addTransaction } = useData();
  const [type, setType] = useState('gave');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const dueDate = new Date(date);
    dueDate.setDate(dueDate.getDate() + 7);
    await addTransaction({
      customerId,
      amount: parseFloat(amount),
      type,
      note: note.trim() || 'No note',
      date: format(date, 'yyyy-MM-dd'),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      status: 'pending',
    });
    Alert.alert('Success', 'Entry added');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeOption, type === 'gave' && styles.typeOptionActive]}
            onPress={() => setType('gave')}
          >
            <Text style={[styles.typeOptionText, type === 'gave' && styles.typeOptionTextActive]}>You Gave</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeOption, type === 'got' && styles.typeOptionActive]}
            onPress={() => setType('got')}
          >
            <Text style={[styles.typeOptionText, type === 'got' && styles.typeOptionTextActive]}>You Got</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Note / Item details</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="e.g., Monthly Grocery"
          value={note}
          onChangeText={setNote}
          multiline
        />

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text>{format(date, 'dd MMM yyyy')}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Entry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16, elevation: 2 },
  typeSelector: { flexDirection: 'row', backgroundColor: '#e9ecef', borderRadius: 30, marginBottom: 20 },
  typeOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 30 },
  typeOptionActive: { backgroundColor: '#2c7da0' },
  typeOptionText: { fontWeight: '600', color: '#666' },
  typeOptionTextActive: { color: '#fff' },
  label: { fontSize: 14, fontWeight: '500', marginTop: 12, marginBottom: 6, color: '#333' },
  amountInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 24, textAlign: 'center' },
  noteInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, minHeight: 80 },
  dateBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, alignItems: 'center' },
  saveBtn: { backgroundColor: '#2c7da0', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
