import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, Share, Linking, Alert, Modal, TextInput, ScrollView, Platform } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import TransactionItem from '../components/TransactionItem';
import { subDays, isAfter } from 'date-fns';
import { Picker } from '@react-native-picker/picker';
import Header from '../components/Header';

export default function CustomerDetailScreen({ route, navigation }) {
  const { customerId } = route.params;
  const { customers, getCustomerTransactions, getTranslation, getCurrencySymbol, settings, updateTransaction, deleteTransaction } = useData();
  
  const customer = customers.find(c => (c.id === customerId || c._id === customerId)) || route.params.customer;
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', '7days', '30days'
  
  // Custom filter states
  const [tagFilter, setTagFilter] = useState('all'); // 'all', 'Goods', 'Services', 'Cash', 'Other'
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Transaction Edit states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('gave');
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] = useState('Goods');
  const [editReason, setEditReason] = useState('');

  const rawTransactions = getCustomerTransactions(customer ? (customer.id || customer._id) : customerId, filter);

  if (!customer) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Customer not found.</Text>
      </View>
    );
  }

  // Filter transactions by date range presets, category tags, and amount ranges
  const getFilteredTransactions = () => {
    let list = rawTransactions;

    if (dateFilter !== 'all') {
      const now = new Date();
      const limitDate = dateFilter === '7days' ? subDays(now, 7) : subDays(now, 30);
      list = list.filter(t => isAfter(new Date(t.date), limitDate));
    }

    if (tagFilter !== 'all') {
      const tagStr = `[${tagFilter}]`;
      list = list.filter(t => t.note && t.note.includes(tagStr));
    }

    if (minAmount.trim() !== '') {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        list = list.filter(t => t.amount >= min);
      }
    }

    if (maxAmount.trim() !== '') {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) {
        list = list.filter(t => t.amount <= max);
      }
    }

    return list;
  };

  const transactions = getFilteredTransactions();

  const getBalanceText = () => {
    if (customer.balance > 0) return 'To Get (Net Receivable)';
    if (customer.balance < 0) return 'To Give (Net Payable)';
    return 'Settled';
  };

  const getBalanceAmount = () => {
    return `${getCurrencySymbol()}${Math.abs(customer.balance).toLocaleString()}`;
  };

  const balanceColor = customer.balance > 0 ? COLORS.success : customer.balance < 0 ? COLORS.danger : COLORS.textMuted;

  // --- Polite Reminder Generator ---
  const sendPoliteReminder = async () => {
    const amountStr = getBalanceAmount();
    const bizName = settings.businessName || 'our Store';
    const reminderMessage = `*Balance Ledger Alert*\nDear ${customer.name},\nThis is a friendly reminder from *${bizName}*. Your pending balance is *${amountStr}*.\nPlease arrange to settle it at your earliest convenience.\n\nThank you!`;

    try {
      const shareOptions = {
        title: 'Send Reminder',
        message: reminderMessage,
      };
      
      if (customer.balance < 0 && customer.phone) {
        const url = `whatsapp://send?phone=${customer.phone.replace(/[^0-9+]/g, '')}&text=${encodeURIComponent(reminderMessage)}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          return;
        }
      }
      await Share.share(shareOptions);
    } catch (error) {
      Alert.alert('Error', 'Unable to share reminder message.');
    }
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setEditAmount(tx.amount.toString());
    setEditType(tx.type);
    
    // Extract category tag (e.g. "[Goods] Purchase" -> category: "Goods", note: "Purchase")
    let noteText = tx.note || '';
    let categoryFound = 'Goods';
    const match = noteText.match(/^\[(Goods|Services|Cash|Other)\]\s*(.*)$/);
    if (match) {
      categoryFound = match[1];
      noteText = match[2];
    }
    
    setEditCategory(categoryFound);
    setEditNote(noteText);
    setEditReason('');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editAmount || parseFloat(editAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    if (!editReason.trim()) {
      Alert.alert('Error', 'Please state the reason for this edit.');
      return;
    }

    const noteWithTag = `[${editCategory}] ${editNote.trim() || 'No description'}`;
    
    const res = await updateTransaction(editingTx.id || editingTx._id, {
      amount: parseFloat(editAmount),
      type: editType,
      note: noteWithTag,
    }, editReason.trim());

    if (res.success) {
      Alert.alert('Success', 'Transaction updated.');
      setEditModalVisible(false);
    } else {
      Alert.alert('Error', res.message || 'Failed to update transaction.');
    }
  };

  const handleDeleteTransaction = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to permanently delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const res = await deleteTransaction(editingTx.id || editingTx._id);
            if (res.success) {
              Alert.alert('Success', 'Transaction deleted.');
              setEditModalVisible(false);
            } else {
              Alert.alert('Error', res.message || 'Failed to delete transaction.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      {/* Header Stat Card */}
      <View style={styles.header}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>{getBalanceText()}</Text>
          <Text style={[styles.balanceAmount, { color: balanceColor }]}>{getBalanceAmount()}</Text>
        </View>
      </View>

      {/* Advanced Filter Panel */}
      <View style={styles.filterPanel}>
        {/* Date Filter presets */}
        <View style={styles.filterCol}>
          <View style={styles.dropdownContainer}>
            <Picker
              selectedValue={dateFilter}
              onValueChange={setDateFilter}
              style={styles.pickerStyle}
              mode="dropdown"
            >
              <Picker.Item label="Date: All" value="all" style={styles.pickerItem} />
              <Picker.Item label="7 Days" value="7days" style={styles.pickerItem} />
              <Picker.Item label="30 Days" value="30days" style={styles.pickerItem} />
            </Picker>
          </View>
        </View>

        {/* Category Tag Filters */}
        <View style={styles.filterCol}>
          <View style={styles.dropdownContainer}>
            <Picker
              selectedValue={tagFilter}
              onValueChange={setTagFilter}
              style={styles.pickerStyle}
              mode="dropdown"
            >
              <Picker.Item label="Tag: All" value="all" style={styles.pickerItem} />
              <Picker.Item label="Goods" value="Goods" style={styles.pickerItem} />
              <Picker.Item label="Services" value="Services" style={styles.pickerItem} />
              <Picker.Item label="Cash" value="Cash" style={styles.pickerItem} />
              <Picker.Item label="Other" value="Other" style={styles.pickerItem} />
            </Picker>
          </View>
        </View>

        {/* Amount Range Filters */}
        <View style={styles.filterColRange}>
          <TextInput
            style={styles.rangeInput}
            placeholder="Min"
            value={minAmount}
            onChangeText={setMinAmount}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textMuted}
          />
          <Text style={styles.rangeDivider}>-</Text>
          <TextInput
            style={styles.rangeInput}
            placeholder="Max"
            value={maxAmount}
            onChangeText={setMaxAmount}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textMuted}
          />
          {(minAmount || maxAmount) ? (
            <TouchableOpacity onPress={() => { setMinAmount(''); setMaxAmount(''); }} style={styles.clearRangeBtnHorizontal}>
              <Icon name="clear" size={14} color={COLORS.danger} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        keyExtractor={item => item.id || item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleOpenEdit(item)}>
            <TransactionItem transaction={item} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No ledger entries match search parameters.</Text>
          </View>
        }
      />

      {/* Edit Entry Modal */}
      {editingTx && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Modify Ledger Entry</Text>
                <TouchableOpacity onPress={handleDeleteTransaction}>
                  <Icon name="delete" size={24} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* You Gave / You Got Switch Toggle */}
                <View style={styles.typeToggle}>
                  <TouchableOpacity
                    style={[styles.typeBtn, editType === 'gave' && { backgroundColor: COLORS.danger }]}
                    onPress={() => setEditType('gave')}
                  >
                    <Text style={[styles.typeBtnText, editType === 'gave' && styles.typeBtnTextActive]}>YOU GAVE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, editType === 'got' && { backgroundColor: COLORS.success }]}
                    onPress={() => setEditType('got')}
                  >
                    <Text style={[styles.typeBtnText, editType === 'got' && styles.typeBtnTextActive]}>YOU GOT</Text>
                  </TouchableOpacity>
                </View>

                {/* Amount Input */}
                <Text style={styles.modalLabel}>Entry Amount ({getCurrencySymbol()})</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                />

                {/* Category Selection */}
                <Text style={styles.modalLabel}>Category Tag</Text>
                <View style={styles.categoryRow}>
                  {['Goods', 'Services', 'Cash', 'Other'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catBtn, editCategory === cat && styles.catBtnActive]}
                      onPress={() => setEditCategory(cat)}
                    >
                      <Text style={[styles.catText, editCategory === cat && styles.catTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Note Description */}
                <Text style={styles.modalLabel}>Description / Notes</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editNote}
                  onChangeText={setEditNote}
                  placeholder="Details of the transaction"
                />

                {/* Mandatory Edit Reason */}
                <Text style={[styles.modalLabel, { color: COLORS.danger }]}>Reason for Change (Required)</Text>
                <TextInput
                  style={[styles.modalInput, { borderColor: COLORS.danger }]}
                  value={editReason}
                  onChangeText={setEditReason}
                  placeholder="e.g. Typo in initial amount"
                />

                {/* Edit History Log */}
                {editingTx.history && editingTx.history.length > 0 && (
                  <View style={styles.historyContainer}>
                    <Text style={styles.historyTitle}>Audit Trails / Modification Logs:</Text>
                    {editingTx.history.map((log, idx) => (
                      <View key={idx} style={styles.historyLogItem}>
                        <Text style={styles.historyLogDate}>
                          {new Date(log.editedAt).toLocaleDateString()} at {new Date(log.editedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                        <Text style={styles.historyLogText}>
                          Changed from {getCurrencySymbol()}{log.previousAmount} ({log.previousType === 'gave' ? 'GAVE' : 'GOT'}) to new settings.
                        </Text>
                        <Text style={styles.historyLogReason}>
                          Reason: <Text style={{ fontStyle: 'italic', fontWeight: '500' }}>{log.reason}</Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Modal Save/Cancel Controls */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnSave, { backgroundColor: editType === 'gave' ? COLORS.danger : COLORS.success }]}
                  onPress={handleSaveEdit}
                >
                  <Icon name="done" size={18} color={COLORS.white} />
                  <Text style={styles.modalBtnSaveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {customer.balance < 0 && (
          <TouchableOpacity
            style={styles.reminderBtn}
            onPress={sendPoliteReminder}
          >
            <Icon name="share" size={20} color={COLORS.primary} />
            <Text style={styles.reminderBtnText}>{getTranslation('reminderBtn')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.transactionActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnDanger]}
            onPress={() => navigation.navigate('CustomersTab', { screen: 'AddEntry', params: { customerId: customer.id || customer._id, type: 'gave' }})}
          >
            <Text style={styles.actionBtnText}>YOU GAVE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnSuccess]}
            onPress={() => navigation.navigate('CustomersTab', { screen: 'AddEntry', params: { customerId: customer.id || customer._id, type: 'got' }})}
          >
            <Text style={styles.actionBtnText}>YOU GOT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { 
    backgroundColor: COLORS.white, 
    padding: SIZES.lg, 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border,
  },
  balanceContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.xl,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
  },
  balanceLabel: { 
    fontSize: SIZES.fontMd, 
    color: COLORS.textLight,
    fontFamily: FONTS.medium,
  },
  balanceAmount: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    marginTop: SIZES.xs 
  },
  filterPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 4,
  },
  filterCol: {
    flex: 1.1,
  },
  filterColRange: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: Platform.OS === 'android' ? 50 : 40,
    paddingHorizontal: 4,
  },
  dropdownContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: Platform.OS === 'android' ? 50 : 40,
    justifyContent: 'center',
  },
  pickerStyle: {
    width: '100%',
    height: Platform.OS === 'android' ? 50 : 40,
    color: COLORS.text,
    backgroundColor: 'transparent',
  },
  pickerItem: {
    fontSize: 11,
  },
  rangeInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
  },
  rangeDivider: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginHorizontal: 2,
  },
  clearRangeBtnHorizontal: {
    padding: 2,
    marginLeft: 2,
  },
  listContent: {
    padding: SIZES.md,
    paddingBottom: 150,
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 40,
  },
  emptyText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomBar: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SIZES.md,
    ...SHADOWS.md,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusXl,
    height: 40,
    marginBottom: SIZES.sm,
    gap: 6,
  },
  reminderBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  transactionActions: {
    flexDirection: 'row',
  },
  actionBtn: { 
    flex: 1, 
    height: 48,
    justifyContent: 'center',
    alignItems: 'center', 
    borderRadius: SIZES.radiusXl,
    marginHorizontal: SIZES.xs,
  },
  btnDanger: {
    backgroundColor: COLORS.danger,
  },
  btnSuccess: {
    backgroundColor: COLORS.success,
  },
  actionBtnText: { 
    color: COLORS.white, 
    fontWeight: '700', 
    fontSize: 14,
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '95%',
    maxHeight: '90%',
    ...SHADOWS.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },
  modalScroll: {
    marginBottom: 16,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 3,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 18,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  typeBtnTextActive: {
    color: COLORS.white,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  catBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
  },
  catBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  catText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  catTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    ...SHADOWS.sm,
  },
  modalBtnCancel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  modalBtnCancelText: {
    color: COLORS.textLight,
    fontWeight: '700',
  },
  modalBtnSave: {
    backgroundColor: COLORS.primary,
  },
  modalBtnSaveText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  // Audit Trails logs
  historyContainer: {
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  historyLogItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
  },
  historyLogDate: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  historyLogText: {
    fontSize: 11,
    color: COLORS.text,
    marginTop: 2,
  },
  historyLogReason: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
