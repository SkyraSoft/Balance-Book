import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import Header from '../components/Header';

export default function NotificationsListScreen() {
  const { 
    notifications, 
    respondToNotification, 
    sendPairRequest, 
    syncWithServer, 
    isOnline,
    getCurrencySymbol
  } = useData();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    syncWithServer();
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
                <Text style={styles.detailsText}>Amount: {getCurrencySymbol()}{item.data.amount}</Text>
                <Text style={styles.detailsText}>Type: {item.data.type === 'gave' ? 'Gave (Lent)' : 'Got (Received)'}</Text>
                {item.data.note ? <Text style={styles.detailsText}>Details: {item.data.note}</Text> : null}
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

        {!isPending && (
          <Text style={styles.statusLabel}>
            Status: <Text style={item.status === 'accepted' ? styles.statusAccept : styles.statusReject}>{item.status.toUpperCase()}</Text>
          </Text>
        )}
      </View>
    );
  };

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
              placeholder="Enter friend's email address..."
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={[styles.pairBtn, loading && styles.pairBtnDisabled]} 
              onPress={handlePair}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.pairBtnText}>Pair</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Feed */}
        <Text style={styles.feedTitle}>Inbox Notifications</Text>
        
        {!isOnline && (
          <View style={styles.offlineWarning}>
            <Icon name="cloud-off" size={20} color={COLORS.danger} />
            <Text style={styles.offlineText}>Connect to the internet to check notifications</Text>
          </View>
        )}

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="notifications-none" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
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
});
