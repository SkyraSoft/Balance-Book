import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useData } from '../context/DataContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Icon from '@expo/vector-icons/MaterialIcons';
import Button from '../components/Button';
import Input from '../components/Input';
import Header from '../components/Header';
import { detectAnomaly } from '../utils/aiHeuristics';

export default function AddEntryScreen({ route, navigation }) {
  const { customerId, type: initialType = 'gave' } = route.params;
  const { addTransaction, customers, getCustomerTransactions, getTranslation, getCurrencySymbol } = useData();
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState(''); // This acts as title
  const [description, setDescription] = useState(''); // New description field
  const [category, setCategory] = useState('Goods'); // 'Goods', 'Services', 'Cash', 'Other'
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [useRepaymentDate, setUseRepaymentDate] = useState(false);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  const customer = customers.find(c => c.id === customerId || c._id === customerId) || { name: 'Customer' };
  const isGave = type === 'gave';
  const activeColor = isGave ? COLORS.danger : COLORS.success;

  const categories = ['Goods', 'Services', 'Cash', 'Other'];

  const handleSave = async (forceSave = false) => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (forceSave !== true && customer.pairedUserId) {
      const rawTransactions = getCustomerTransactions(customer.id || customer._id);
      const { isAnomaly, avgAmount } = detectAnomaly(parseFloat(amount), rawTransactions);
      if (isAnomaly) {
        Alert.alert(
          'Smart Alert: Unusual Amount',
          `This amount (${getCurrencySymbol()}${amount}) is unusually high compared to your typical history with ${customer.name} (Avg: ${getCurrencySymbol()}${avgAmount.toFixed(2)}).\n\nAre you sure you want to proceed?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Yes, Proceed', style: 'destructive', onPress: () => handleSave(true) }
          ]
        );
        return;
      }
    }
    let finalDueDate;
    if (useRepaymentDate) {
      finalDueDate = new Date(dueDate);
    } else {
      finalDueDate = new Date(date);
      finalDueDate.setDate(finalDueDate.getDate() + 7); // Default 7 days
    }
    
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
      description: description.trim(),
      date: transactionDate.toISOString(),
      dueDate: format(finalDueDate, 'yyyy-MM-dd'),
      status: customer.pairedUserId ? 'pending' : 'confirmed',
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
              placeholder="Title"
              value={note}
              onChangeText={setNote}
            />
            
            <View style={styles.descriptionWrapper}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Why did you borrow/lend this?"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={350}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length}/350</Text>
            </View>
  
            <View style={styles.dateWrapper}>
              <Icon name="calendar-today" size={20} color={COLORS.textLight} />
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>{format(date, 'dd MMM yyyy')}</Text>
              </TouchableOpacity>
            </View>

            {/* Repayment Reminder Section */}
            <View style={styles.repaymentSection}>
              <View style={styles.repaymentHeader}>
                <Icon name="alarm" size={20} color={COLORS.primary} />
                <Text style={styles.repaymentTitle}>{isGave ? 'Expected Payment Date' : 'Set Repayment Reminder'}</Text>
                <Switch
                  value={useRepaymentDate}
                  onValueChange={setUseRepaymentDate}
                  trackColor={{ false: '#E2E8F0', true: COLORS.primaryLight }}
                  thumbColor={useRepaymentDate ? COLORS.primary : '#f4f3f4'}
                  style={{ marginLeft: 'auto' }}
                />
              </View>
              {useRepaymentDate && (
                <View style={[styles.dateWrapper, { marginTop: SIZES.sm }]}>
                  <Text style={styles.label}>{isGave ? 'Expected On:' : 'Repayment Due On:'}</Text>
                  <TouchableOpacity style={[styles.dateBtn, { marginLeft: 10 }]} onPress={() => setShowDueDatePicker(true)}>
                    <Text style={[styles.dateText, { color: COLORS.primary, fontWeight: 'bold' }]}>
                      {format(dueDate, 'dd MMM yyyy')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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

          {showDueDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDueDatePicker(false);
                if (selectedDate) setDueDate(selectedDate);
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
  descriptionWrapper: {
    marginTop: SIZES.md,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    height: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
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
  repaymentSection: {
    marginTop: SIZES.lg,
    padding: SIZES.md,
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  repaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repaymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  footer: { 
    padding: SIZES.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
