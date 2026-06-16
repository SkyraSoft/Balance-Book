import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';

export default function PeerConnectionScreen() {
  const { sendPairRequest, token, isOnline, pairedUsers } = useData();
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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Connect with Peer Merchants</Text>
          <Text style={styles.subtitle}>
            Link accounts with other Balance Book users. When you record a credit or collection for them, a notification is sent to validate and sync the transaction automatically on their end.
          </Text>
  
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Enter friend's email or phone number..."
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={[styles.pairBtn, loading && styles.pairBtnDisabled]} 
              onPress={handlePair}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.pairBtnText}>Send Request</Text>}
            </TouchableOpacity>
          </View>
        </View>
  
        <Text style={styles.headerTitle}>Connected Peers</Text>
  
        {loadingList ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} size="large" />
        ) : resolvedPairedUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="link-off" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No paired connections found.</Text>
          </View>
        ) : (
          <FlatList
            data={resolvedPairedUsers}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <View style={styles.peerCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.businessName || item.email || item.businessPhone || '?').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.details}>
                  <Text style={styles.peerName}>{item.businessName || 'Merchant'}</Text>
                  <Text style={styles.peerEmail}>{item.email}</Text>
                  {item.businessPhone ? <Text style={styles.peerPhone}>{item.businessPhone}</Text> : null}
                </View>
                <View style={styles.statusBadge}>
                  <Icon name="check-circle" size={14} color={COLORS.success} />
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, ...SHADOWS.sm, marginBottom: 20 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
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
  headerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 8, color: COLORS.textMuted, fontSize: 13 },
  peerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.sm,
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
  peerName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  peerEmail: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  peerPhone: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E6F4EA', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, color: COLORS.success, fontWeight: '700' },
});
