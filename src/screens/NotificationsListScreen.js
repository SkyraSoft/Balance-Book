import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../utils/theme';
import Header from '../components/Header';
import * as Contacts from 'expo-contacts';

export default function NotificationsListScreen() {
  const { 
    notifications, 
    transactions,
    customers,
    respondToNotification, 
    sendPairRequest, 
    syncWithServer, 
    isOnline,
    getCurrencySymbol,
    markNotificationsAsRead
  } = useData();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'reminders', 'alerts'

  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    syncWithServer();
    if (markNotificationsAsRead) {
      markNotificationsAsRead();
    }
  }, []);

  const handlePair = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const result = await sendPairRequest(email);
    setLoading(false);
    if (result.success) {
      Alert.alert('Success', result.message || 'Pair request sent!');
      setEmail('');
      syncWithServer();
    } else {
      Alert.alert('Error', result.message || 'Failed to send pairing request.');
    }
  };

  const cleanPhoneNumber = (number) => {
    if (!number) return '';
    return number.replace(/[^\d+]/g, '');
  };

  const handleLoadContacts = async () => {
    setLoadingContacts(true);
    setContactsModalVisible(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Contacts permission is required.');
        setContactsModalVisible(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (data.length > 0) {
        const mapped = data
          .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
          .map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phoneNumbers[0].number,
            cleanedPhone: cleanPhoneNumber(c.phoneNumbers[0].number),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setDeviceContacts(mapped);
        setFilteredContacts(mapped);
      } else {
        Alert.alert('No Contacts', 'No contacts found on this device.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to retrieve contacts list.');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSearchContacts = (text) => {
    setContactSearch(text);
    if (!text) {
      setFilteredContacts(deviceContacts);
      return;
    }
    const filtered = deviceContacts.filter(c => 
      c.name.toLowerCase().includes(text.toLowerCase()) || 
      c.phone.includes(text)
    );
    setFilteredContacts(filtered);
  };

  const handleResponse = async (id, status) => {
    setActionId(id);
    const success = await respondToNotification(id, status);
    setActionId(null);
    if (success) {
      Alert.alert('Success', `Request ${status} successfully.`);
      syncWithServer();
    } else {
      Alert.alert('Error', 'Failed to submit response.');
    }
  };

  const renderItem = ({ item }) => {
    const isPending = item.status === 'pending';
    const isInvite = item.type === 'pair_request';
    const isLedger = item.type === 'ledger_request';

    return (
      <View style={[styles.card, !isPending && styles.cardRead]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, isInvite ? styles.iconInvite : styles.iconLedger]}>
            <Icon 
              name={isInvite ? 'person-add' : isLedger ? 'swap-horiz' : 'notifications'} 
              size={20} 
              color={COLORS.white} 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
            
            {isLedger && item.data && (
              <View style={styles.detailsBox}>
                {item.data.action && item.data.action !== 'create' && (
                  <Text style={[styles.detailsText, { fontWeight: 'bold', color: item.data.action === 'delete' ? COLORS.danger : COLORS.primary }]}>
                    Action: {item.data.action.toUpperCase()}
                  </Text>
                )}
                <Text style={styles.detailsText}>Amount: {getCurrencySymbol()}{item.data.amount}</Text>
                <Text style={styles.detailsText}>Type: {item.data.type === 'gave' ? 'They Gave (You Got)' : 'They Got (You Gave)'}</Text>
                {item.data.note ? <Text style={styles.detailsText}>Title: {item.data.note}</Text> : null}
                {item.data.description ? <Text style={styles.detailsText}>Description: {item.data.description}</Text> : null}
              </View>
            )}
          </View>
        </View>

        {isPending && (isInvite || isLedger) && (
          <View style={styles.btnRow}>
            {actionId === item._id ? (
              <ActivityIndicator color={COLORS.primary} style={{ flex: 1, alignSelf: 'center' }} />
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.btn, styles.btnReject]} 
                  onPress={() => handleResponse(item._id, 'rejected')}
                >
                  <Text style={styles.btnRejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, styles.btnAccept]} 
                  onPress={() => handleResponse(item._id, 'accepted')}
                >
                  <Text style={styles.btnAcceptText}>Accept</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {!isPending && isInvite && (
          <Text style={styles.statusLabel}>
            Status: <Text style={item.status === 'accepted' ? styles.statusAccept : styles.statusReject}>{item.status.toUpperCase()}</Text>
          </Text>
        )}
      </View>
    );
  };

  const getReminders = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    return (transactions || []).filter(t => {
      if (!t.dueDate || t.status === 'pending_peer_approval' || t.status === 'rejected') return false;
      const due = new Date(t.dueDate);
      return due <= today;
    }).map(t => {
      const cust = (customers || []).find(c => c.id === t.customerId || c._id === t.customerId);
      return {
        _id: 'rem_' + (t._id || t.id),
        type: 'reminder',
        status: 'read',
        createdAt: t.dueDate,
        message: `Payment Reminder: A transaction of ${getCurrencySymbol()}${t.amount} with ${cust?.name || 'Customer'} was due on ${new Date(t.dueDate).toLocaleDateString()}.`,
        data: t
      };
    });
  };

  const reminders = getReminders();
  const requests = (notifications || []).filter(n => n.type === 'pair_request' || n.type === 'ledger_request');
  const alerts = (notifications || []).filter(n => n.type !== 'pair_request' && n.type !== 'ledger_request');

  const getActiveData = () => {
    if (activeTab === 'requests') return requests;
    if (activeTab === 'reminders') return reminders;
    return alerts;
  };

  const activeData = getActiveData();

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFBFC' }}>
      <Header />
      <View style={styles.container}>
        {/* Pair Input Panel */}
        <View style={styles.pairPanel}>
          <Text style={styles.panelTitle}>Connect with Peer Ledger</Text>
          <Text style={styles.panelSubtitle}>Pair accounts with other merchants to auto-validate mutual lending records</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email or phone..."
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.contactBtn} 
              onPress={handleLoadContacts}
            >
              <Icon name="contacts" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pairBtn, loading && styles.pairBtnDisabled]} 
              onPress={handlePair}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.pairBtnText}>Pair</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'requests' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'requests' && styles.tabBtnTextActive]}>Requests ({requests.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'reminders' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('reminders')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'reminders' && styles.tabBtnTextActive]}>Reminders ({reminders.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'alerts' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('alerts')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'alerts' && styles.tabBtnTextActive]}>Alerts</Text>
          </TouchableOpacity>
        </View>

        {activeData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="notifications-none" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No notifications here.</Text>
          </View>
        ) : (
          <FlatList
            data={activeData}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Contacts Modal */}
        <Modal visible={contactsModalVisible} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contact</Text>
              <TouchableOpacity onPress={() => setContactsModalVisible(false)}>
                <Icon name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchBoxContainer}>
              <Icon name="search" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchBox}
                placeholder="Search contacts..."
                value={contactSearch}
                onChangeText={handleSearchContacts}
              />
            </View>

            {loadingContacts ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={filteredContacts}
                keyExtractor={item => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.contactItem}
                    onPress={() => {
                      setEmail(item.cleanedPhone);
                      setContactsModalVisible(false);
                    }}
                  >
                    <View style={styles.contactIcon}>
                      <Text style={styles.contactIconText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.contactDetails}>
                      <Text style={styles.contactName}>{item.name}</Text>
                      <Text style={styles.contactPhone}>{item.phone}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.noContactsText}>No matching contacts</Text>}
              />
            )}
          </View>
        </Modal>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
    padding: SIZES.lg,
  },
  pairPanel: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    ...SHADOWS.sm,
    marginBottom: SIZES.xl,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  panelSubtitle: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
    marginBottom: SIZES.md,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    height: 44,
    fontSize: 14,
    backgroundColor: '#FAFBFC',
  },
  pairBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pairBtnDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  pairBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  cardRead: {
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  iconInvite: {
    backgroundColor: COLORS.primary,
  },
  iconLedger: {
    backgroundColor: '#0F766E',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 18,
  },
  time: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  detailsBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 2,
  },
  detailsText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: SIZES.radius,
  },
  btnAccept: {
    backgroundColor: COLORS.primary,
  },
  btnAcceptText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  btnReject: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  btnRejectText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 12,
  },
  statusLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'right',
  },
  statusAccept: {
    color: COLORS.success,
    fontWeight: '700',
  },
  statusReject: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: SIZES.md,
  },
  offlineText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  contactBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: SIZES.md,
    paddingHorizontal: SIZES.md,
    height: 48,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBox: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  contactItem: {
    flexDirection: 'row',
    padding: SIZES.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  contactPhone: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  noContactsText: {
    textAlign: 'center',
    padding: 20,
    color: COLORS.textMuted,
    fontSize: 14,
  },
});
