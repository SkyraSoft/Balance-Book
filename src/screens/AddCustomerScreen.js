import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Modal, 
  FlatList, 
  TextInput,
  ActivityIndicator,
  Share,
  Linking
} from 'react-native';
import { useData } from '../context/DataContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import * as Contacts from 'expo-contacts';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Header from '../components/Header';

export default function AddCustomerScreen({ navigation }) {
  const { addCustomer, token, isOnline, settings } = useData();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState('');
  const [balanceType, setBalanceType] = useState('gave'); // 'gave' or 'got'
  
  // Contacts states
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [registeredUsersMap, setRegisteredUsersMap] = useState({}); // phone -> userId map
  const [selectedPairedUserId, setSelectedPairedUserId] = useState(null);

  const handleInvite = async (channel) => {
    const bizName = settings?.businessName || 'our Store';
    const inviteMsg = `Hi ${name.trim()}! I've added you to my ledger on BalanceBook to track our transactions transparently. You can install the app and pair our ledger so they sync automatically. Download here: https://play.google.com/store/apps/details?id=com.balancebook.app`;
    const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
    
    let url = '';
    if (channel === 'whatsapp') {
      url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(inviteMsg)}`;
    } else if (channel === 'sms') {
      const separator = Platform.OS === 'ios' ? '&' : '?';
      url = `sms:${cleanPhone}${separator}body=${encodeURIComponent(inviteMsg)}`;
    } else if (channel === 'wechat') {
      url = `wechat://`;
    }

    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          navigation.goBack();
          return;
        } else {
          Alert.alert('Not Supported', `We couldn't open the app for ${channel}. We will open general Share instead.`, [
            {
              text: 'OK',
              onPress: async () => {
                await Share.share({ message: inviteMsg });
                navigation.goBack();
              }
            }
          ]);
        }
      } catch (err) {
        console.error('Error launching link:', err);
        await Share.share({ message: inviteMsg });
        navigation.goBack();
      }
    } else {
      try {
        await Share.share({ message: inviteMsg });
      } catch (e) {
        console.error(e);
      }
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill name and phone number');
      return;
    }
    
    await addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      type: 'Regular',
      initialBalance: balance,
      balanceType: balanceType,
      pairedUserId: selectedPairedUserId,
    });
    
    if (!selectedPairedUserId) {
      Alert.alert(
        'Invite & Connect Ledger',
        `${name.trim()} is not on BalanceBook yet. Select an option to invite them to Pair Peer Ledger for auto-syncing:`,
        [
          { text: 'Cancel / Skip', onPress: () => navigation.goBack(), style: 'cancel' },
          { text: 'WhatsApp', onPress: () => handleInvite('whatsapp') },
          { text: 'SMS Messages', onPress: () => handleInvite('sms') },
          { text: 'More Apps (Share)', onPress: () => handleInvite('share') },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const cleanPhoneNumber = (number) => {
    if (!number) return '';
    // Strip everything except numbers and '+' symbol
    let cleaned = number.replace(/[^\d+]/g, '');
    // If it starts with local prefix, keep it or normalize
    return cleaned;
  };

  const handleLoadContacts = async () => {
    setLoadingContacts(true);
    setContactsModalVisible(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Contacts permission is required to select from contacts.');
        setContactsModalVisible(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (data.length > 0) {
        // Map contacts
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

        // Check which contacts are on this app via Firestore query
        if (isOnline && token) {
          const phonesToCheck = mapped.map(m => m.cleanedPhone).filter(Boolean);
          const rMap = {};
          
          if (phonesToCheck.length > 0) {
            const chunks = [];
            for (let i = 0; i < phonesToCheck.length; i += 30) {
              chunks.push(phonesToCheck.slice(i, i + 30));
            }

            for (const chunk of chunks) {
              const usersQuery = query(
                collection(db, 'users'),
                where('normalizedPhone', 'in', chunk)
              );
              const querySnap = await getDocs(usersQuery);
              querySnap.forEach((doc) => {
                const data = doc.data();
                if (data.normalizedPhone) {
                  rMap[data.normalizedPhone] = doc.id;
                }
              });
            }
          }
          setRegisteredUsersMap(rMap);
        }
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

  const handleSelectContact = (contact) => {
    setName(contact.name);
    
    // Check if phone matches any registered user
    const pairedId = registeredUsersMap[contact.cleanedPhone] || null;
    setSelectedPairedUserId(pairedId);
    setPhone(contact.phone);

    setContactsModalVisible(false);

    if (pairedId) {
      Alert.alert('Balance Book User', `${contact.name} is a registered Balance Book merchant! Transactions will be synced to them.`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : null}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <TouchableOpacity style={styles.contactBtn} onPress={handleLoadContacts}>
          <View style={styles.iconCircle}>
            <Icon name="contacts" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.contactText}>Add Customer from Contacts</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Input 
            label="Customer Name"
            placeholder="e.g. John Doe" 
            value={name} 
            onChangeText={setName} 
          />

          <View style={styles.phoneInputWrapper}>
            <Input 
              label="Mobile Number"
              placeholder="+91 9876543210" 
              value={phone} 
              onChangeText={(txt) => {
                setPhone(txt);
                setSelectedPairedUserId(null); // Reset peer sync since phone changed manually
              }} 
              keyboardType="phone-pad" 
            />
            {selectedPairedUserId && (
              <View style={styles.pairedBadgeInline}>
                <Icon name="verified" size={14} color="#0F766E" />
                <Text style={styles.pairedBadgeTextInline}>Linked Account</Text>
              </View>
            )}
          </View>

          <Text style={styles.label}>Opening Balance (Optional)</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceInputWrapper}>
              <Input
                placeholder="0"
                value={balance}
                onChangeText={setBalance}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, balanceType === 'gave' && styles.typeBtnDanger]}
                onPress={() => setBalanceType('gave')}
              >
                <Text style={[styles.typeText, balanceType === 'gave' && styles.typeTextActive]}>You Gave</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, balanceType === 'got' && styles.typeBtnSuccess]}
                onPress={() => setBalanceType('got')}
              >
                <Text style={[styles.typeText, balanceType === 'got' && styles.typeTextActive]}>You Got</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Button title="ADD CUSTOMER" onPress={handleSave} />
      </View>

      {/* Contacts List Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={contactsModalVisible}
        onRequestClose={() => setContactsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Import from Contacts</Text>
            
            <View style={styles.searchBox}>
              <Icon name="search" size={20} color={COLORS.textLight} />
              <TextInput
                style={styles.searchInput}
                value={contactSearch}
                onChangeText={handleSearchContacts}
                placeholder="Search contacts..."
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {loadingContacts ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 40 }} size="large" />
            ) : filteredContacts.length === 0 ? (
              <Text style={styles.noContactsText}>No contacts found</Text>
            ) : (
              <FlatList
                data={filteredContacts}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const isOnApp = !!registeredUsersMap[item.cleanedPhone];
                  return (
                    <TouchableOpacity 
                      style={styles.contactItem}
                      onPress={() => handleSelectContact(item)}
                    >
                      <View style={styles.contactAvatar}>
                        <Text style={styles.contactAvatarText}>{item.name.substring(0, 2).toUpperCase()}</Text>
                      </View>
                      <View style={styles.contactDetails}>
                        <Text style={styles.contactName}>{item.name}</Text>
                        <Text style={styles.contactPhone}>{item.phone}</Text>
                      </View>
                      {isOnApp && (
                        <View style={styles.pairedBadge}>
                          <Icon name="verified" size={12} color={COLORS.white} />
                          <Text style={styles.pairedBadgeText}>On App</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setContactsModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { padding: SIZES.md },
  contactBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    borderRadius: SIZES.radiusLg, 
    padding: SIZES.md, 
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  contactText: { 
    color: COLORS.primary, 
    fontWeight: 'bold', 
    fontSize: SIZES.fontMd,
  },
  card: { 
    backgroundColor: COLORS.white, 
    padding: SIZES.lg, 
    borderRadius: SIZES.radiusLg, 
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  phoneInputWrapper: {
    position: 'relative',
  },
  pairedBadgeInline: {
    position: 'absolute',
    right: 12,
    top: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  pairedBadgeTextInline: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0F766E',
  },
  label: { 
    fontSize: SIZES.fontMd, 
    fontWeight: '600', 
    color: COLORS.text, 
    marginBottom: SIZES.xs,
  },
  balanceRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginTop: SIZES.xs,
  },
  balanceInputWrapper: { 
    flex: 1, 
    marginRight: SIZES.sm,
  },
  typeToggle: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.surface, 
    borderRadius: SIZES.radius, 
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtn: { 
    paddingHorizontal: SIZES.md, 
    paddingVertical: SIZES.sm, 
    borderRadius: SIZES.radius,
  },
  typeBtnDanger: { backgroundColor: COLORS.danger },
  typeBtnSuccess: { backgroundColor: COLORS.success },
  typeText: { 
    color: COLORS.textLight, 
    fontWeight: 'bold',
  },
  typeTextActive: { 
    color: COLORS.white,
  },
  footer: { 
    padding: SIZES.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xl,
    width: '90%',
    maxHeight: '80%',
    ...SHADOWS.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    height: 40,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: SIZES.sm,
    fontSize: 13,
    color: COLORS.text,
  },
  noContactsText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginVertical: 40,
    fontSize: 14,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: '#0369A1',
    fontWeight: 'bold',
    fontSize: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  contactPhone: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  pairedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  pairedBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },
  modalCloseBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
