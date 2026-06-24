import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Share } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';

export default function PeerConnectionScreen() {
  const { sendPairRequest, token, isOnline, pairedUsers, userEmail, settings } = useData();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [resolvedPairedUsers, setResolvedPairedUsers] = useState([]);

  useEffect(() => {
    loadPairedUsers();
  }, [pairedUsers]);

  const loadPairedUsers = async () => {
    if (!pairedUsers || pairedUsers.length === 0) {
      setResolvedPairedUsers([]);
      return;
    }
    setLoadingList(true);
    try {
      const list = [];
      for (const pId of pairedUsers) {
        if (pId && typeof pId === 'string') {
          const docSnap = await getDoc(doc(db, 'users', pId));
          if (docSnap.exists()) {
            list.push({ _id: docSnap.id, ...docSnap.data() });
          }
        }
      }
      setResolvedPairedUsers(list);
    } catch (err) {
      console.error('Error resolving paired users:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const handlePair = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter a valid email or phone number.');
      return;
    }
    setLoading(true);
    const result = await sendPairRequest(identifier);
    setLoading(false);
    if (result.success) {
      Alert.alert('Success', result.message || 'Connection request sent!');
      setIdentifier('');
    } else {
      Alert.alert('Error', result.message || 'Failed to send pairing request.');
    }
  };

  const handleShareDetails = async (value, label) => {
    if (!value) return;
    try {
      await Share.share({
        message: `Hi! Here are my BalanceBook pairing details:\n${label}: ${value}\n\nEnter this in your BalanceBook app to link our ledgers!`,
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Sync Illustration & Header */}
        <View style={styles.illustrationsHeader}>
          <View style={styles.connectionIconCircle}>
            <Icon name="sync" size={32} color={COLORS.white} />
          </View>
          <Text style={styles.headerTitleMain}>Peer Sync Center</Text>
          <Text style={styles.headerSubtitleMain}>
            Connect and validate transactions in real-time with other shopkeepers
          </Text>
        </View>

        {/* My Pairing ID Card */}
        <View style={styles.myIdCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.myIdCardTitle}>My Pairing ID</Text>
            <View style={styles.badgeOnline}>
              <Text style={styles.badgeOnlineText}>Active</Text>
            </View>
          </View>
          <Text style={styles.myIdCardDesc}>
            Share either detail below with another merchant so they can send you a connection request.
          </Text>
          
          <View style={styles.myIdRows}>
            <View style={styles.myIdRow}>
              <Icon name="email" size={18} color="#4F46E5" />
              <Text style={styles.myIdText} numberOfLines={1}>{userEmail || 'No email registered'}</Text>
              <TouchableOpacity style={styles.shareIconBtn} onPress={() => handleShareDetails(userEmail, 'Email')}>
                <Icon name="share" size={14} color="#4F46E5" />
              </TouchableOpacity>
            </View>
            
            {settings?.businessPhone ? (
              <View style={styles.myIdRow}>
                <Icon name="phone" size={18} color="#4F46E5" />
                <Text style={styles.myIdText}>{settings.businessPhone}</Text>
                <TouchableOpacity style={styles.shareIconBtn} onPress={() => handleShareDetails(settings.businessPhone, 'Phone')}>
                  <Icon name="share" size={14} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {/* Send Pair Request Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Link New Peer Merchant</Text>
          <Text style={styles.subtitle}>
            Enter their registered phone number or email address below to send a sync request.
          </Text>
  
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Friend's email or phone number..."
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={[styles.pairBtn, loading && styles.pairBtnDisabled]} 
              onPress={handlePair}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.pairBtnText}>Send Link</Text>}
            </TouchableOpacity>
          </View>
        </View>
  
        {/* Connected Peers Section */}
        <Text style={styles.headerTitle}>Connected Peers</Text>
  
        {loadingList ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} size="large" />
        ) : resolvedPairedUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="link-off" size={32} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyText}>No paired connections found.</Text>
            <Text style={styles.emptySubText}>Add a peer above to sync transaction entries in real-time!</Text>
          </View>
        ) : (
          <View style={styles.peerList}>
            {resolvedPairedUsers.map(item => (
              <View key={item._id} style={styles.peerCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.businessName || item.email || item.businessPhone || '?').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.details}>
                  <Text style={styles.peerName}>{item.businessName || 'Merchant Partner'}</Text>
                  <Text style={styles.peerEmail}>{item.email}</Text>
                  {item.businessPhone ? <Text style={styles.peerPhone}>{item.businessPhone}</Text> : null}
                </View>
                <View style={styles.statusBadge}>
                  <Icon name="check-circle" size={14} color={COLORS.success} />
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  illustrationsHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  connectionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    marginBottom: SIZES.md,
  },
  headerTitleMain: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerSubtitleMain: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  myIdCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  myIdCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#312E81',
  },
  badgeOnline: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeOnlineText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.success,
  },
  myIdCardDesc: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
    marginBottom: 12,
  },
  myIdRows: {
    gap: 8,
  },
  myIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    gap: 8,
  },
  myIdText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  shareIconBtn: {
    padding: 4,
  },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, ...SHADOWS.sm, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  title: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 12, color: COLORS.textLight, lineHeight: 18, marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 8 },
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
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  pairBtnDisabled: { backgroundColor: COLORS.textMuted },
  pairBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyContainer: { 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: { color: COLORS.text, fontWeight: '700', fontSize: 13, marginBottom: 4 },
  emptySubText: { color: COLORS.textLight, fontSize: 11, textAlign: 'center' },
  peerList: {
    gap: 8,
  },
  peerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  details: { flex: 1 },
  peerName: { fontSize: 13, fontWeight: '750', color: COLORS.text },
  peerEmail: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  peerPhone: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E6F4EA', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, color: COLORS.success, fontWeight: '700' },
});
