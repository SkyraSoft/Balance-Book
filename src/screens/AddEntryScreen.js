import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useData } from '../context/DataContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Icon from '@expo/vector-icons/MaterialIcons';
import Button from '../components/Button';
import Input from '../components/Input';
import Header from '../components/Header';

export default function AddEntryScreen({ route, navigation }) {
  const { customerId, type: initialType = 'gave' } = route.params;
  const { addTransaction, customers, getTranslation, getCurrencySymbol } = useData();
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Goods'); // 'Goods', 'Services', 'Cash', 'Other'
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const customer = customers.find(c => c.id === customerId || c._id === customerId) || { name: 'Customer' };
  const isGave = type === 'gave';
  const activeColor = isGave ? COLORS.danger : COLORS.success;

  const categories = ['Goods', 'Services', 'Cash', 'Other'];

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const dueDate = new Date(date);
    dueDate.setDate(dueDate.getDate() + 7);
    
    // Save entry with category tag prepended to note
    const noteWithTag = `[${category}] ${note.trim() || 'No description'}`;
    
    const transactionDate = new Date(date);
    const now = new Date();
    transactionDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    await addTransaction({
      customerId,
      amount: parseFloat(amount),
      type,
      note: noteWithTag,
      date: transactionDate.toISOString(),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      status: 'pending',
    });
    Alert.alert('Success', 'Entry added');
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : null}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.headerBox, { backgroundColor: isGave ? '#FEE2E2' : '#DCFCE7' }]}>
            <Text style={styles.headerSubtitle}>Adding entry for</Text>
            <Text style={styles.headerTitle}>{customer.name}</Text>
          </View>
  
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeOption, isGave && { backgroundColor: COLORS.danger, ...SHADOWS.md }]}
              onPress={() => setType('gave')}
            >
              <Text style={[styles.typeOptionText, isGave && styles.typeOptionTextActive]}>YOU GAVE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, !isGave && { backgroundColor: COLORS.success, ...SHADOWS.md }]}
              onPress={() => setType('got')}
            >
              <Text style={[styles.typeOptionText, !isGave && styles.typeOptionTextActive]}>YOU GOT</Text>
            </TouchableOpacity>
          </View>
  
          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, { color: activeColor }]}>{getCurrencySymbol()}</Text>
            <TextInput
              style={[styles.amountInput, { color: activeColor }]}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
  
          {/* Expense/Transaction Category Selector */}
          <View style={styles.categorySection}>
            <Text style={styles.label}>{getTranslation('category')}</Text>
            <View style={styles.categoryRow}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryBtn, 
                    category === cat && [styles.categoryBtnActive, { borderColor: activeColor }]
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryText, 
                    category === cat && [styles.categoryTextActive, { color: activeColor }]
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
  
          <View style={styles.detailsContainer}>
            <Input
              placeholder={getTranslation('notePlaceholder')}
              value={note}
              onChangeText={setNote}
            />
  
            <View style={styles.dateWrapper}>
              <Icon name="calendar-today" size={20} color={COLORS.textLight} />
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>{format(date, 'dd MMM yyyy')}</Text>
              </TouchableOpacity>
            </View>
          </View>
  
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
        </ScrollView>
  
        <View style={styles.footer}>
          <Button 
            title={getTranslation('saveEntry')} 
            onPress={handleSave} 
            style={{ backgroundColor: activeColor }}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { paddingBottom: 80 },
  headerBox: {
    padding: SIZES.lg,
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  headerSubtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textLight,
  },
  headerTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  typeSelector: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.border, 
    borderRadius: SIZES.radiusXl, 
    marginHorizontal: SIZES.lg,
    padding: 4,
    marginBottom: SIZES.xl,
  },
  typeOption: { 
    flex: 1, 
    paddingVertical: SIZES.sm, 
    alignItems: 'center', 
    borderRadius: SIZES.radiusXl,
  },
  typeOptionText: { 
    fontFamily: FONTS.medium,
    fontWeight: '600', 
    color: COLORS.textLight,
  },
  typeOptionTextActive: { 
    color: COLORS.white,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.xl,
  },
  currencySymbol: {
    fontSize: 40,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: { 
    fontSize: 48,
    fontWeight: 'bold',
    minWidth: 100,
    textAlign: 'center',
  },
  label: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: COLORS.textLight, 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SIZES.xs,
  },
  categorySection: {
    marginHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  categoryBtn: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  categoryBtnActive: {
    borderWidth: 1.5,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  categoryTextActive: {
    fontWeight: '700',
  },
  detailsContainer: {
    marginHorizontal: SIZES.lg,
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.sm,
  },
  dateBtn: { 
    marginLeft: SIZES.sm,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  footer: { 
    padding: SIZES.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
