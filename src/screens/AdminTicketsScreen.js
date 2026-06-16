import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import Icon from '@expo/vector-icons/MaterialIcons';
import { db } from '../config/firebase';
import { collection, query, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

export default function AdminTicketsScreen() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const ticketsQuery = query(collection(db, 'supportTickets'));
      const querySnap = await getDocs(ticketsQuery);
      const list = [];
      for (const docSnap of querySnap.docs) {
        const ticket = { _id: docSnap.id, ...docSnap.data() };
        if (ticket.userId) {
          try {
            const uDoc = await getDoc(doc(db, 'users', ticket.userId));
            if (uDoc.exists()) {
              ticket.userId = {
                id: uDoc.id,
                email: uDoc.data().email,
                businessName: uDoc.data().businessName,
                businessPhone: uDoc.data().businessPhone
              };
            }
          } catch (e) {
            console.log('Error loading ticket user details:', e);
          }
        }
        list.push(ticket);
      }
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTickets(list);
    } catch (error) {
      console.error('Error fetching tickets from Firestore:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      const ticketRef = doc(db, 'supportTickets', id);
      await updateDoc(ticketRef, { status: 'resolved' });
      Alert.alert('Success', 'Ticket marked as resolved.');
      fetchTickets();
    } catch (error) {
      console.error('Error resolving ticket:', error);
      Alert.alert('Error', 'Failed to resolve ticket.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Support Queries</Text>
        <TouchableOpacity onPress={fetchTickets}>
          <Icon name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading && tickets.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchTickets}
          refreshing={loading}
          ListEmptyComponent={
            <Text style={styles.empty}>No help queries submitted yet.</Text>
          }
          renderItem={({ item }) => {
            const dateStr = new Date(item.createdAt).toLocaleString();
            const isOpen = item.status === 'open';
            const userDetails = item.userId ? `${item.userId.businessName || 'Merchant'} (${item.userId.email})` : 'Anonymous';

            return (
              <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <View style={styles.catRow}>
                    <Icon name="label" size={16} color={COLORS.primary} />
                    <Text style={styles.category}>{item.category} Issues</Text>
                  </View>
                  <View style={[styles.statusBadge, isOpen ? styles.badgeOpen : styles.badgeResolved]}>
                    <Text style={[styles.statusText, isOpen ? styles.textOpen : styles.textResolved]}>
                      {isOpen ? 'Open' : 'Resolved'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.merchantLabel}>From: <Text style={styles.merchantValue}>{userDetails}</Text></Text>
                <Text style={styles.message}>"{item.message}"</Text>
                <Text style={styles.date}>{dateStr}</Text>

                {isOpen && (
                  <TouchableOpacity 
                    style={styles.resolveBtn} 
                    onPress={() => handleResolve(item._id)}
                  >
                    <Icon name="check-circle" size={16} color={COLORS.white} />
                    <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  listContent: {
    padding: SIZES.lg,
  },
  ticketCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  category: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeOpen: {
    backgroundColor: '#FEE2E2',
  },
  badgeResolved: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textOpen: {
    color: COLORS.danger,
  },
  textResolved: {
    color: COLORS.success,
  },
  merchantLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 8,
  },
  merchantValue: {
    color: COLORS.text,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    fontStyle: 'italic',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 6,
  },
  date: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 8,
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 36,
    borderRadius: SIZES.radius,
    gap: 6,
    marginTop: 4,
    ...SHADOWS.sm,
  },
  resolveBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: 40,
    fontSize: 14,
  },
});
