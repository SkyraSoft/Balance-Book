import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Icon from '@expo/vector-icons/MaterialIcons';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function AdminHomeScreen() {
  const { isOnline } = useData();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalGave: 0,
    totalGot: 0,
    netReceivables: 0,
    openTicketsCount: 0,
  });
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('merchants'); // 'merchants' or 'analytics'
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [merchantModalVisible, setMerchantModalVisible] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch all standard users (role == 'user')
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'user'));
      const usersSnap = await getDocs(usersQuery);
      const fetchedMerchants = [];
      usersSnap.forEach(doc => {
        fetchedMerchants.push({ _id: doc.id, ...doc.data() });
      });

      // 2. Fetch all customers
      const customersSnap = await getDocs(collection(db, 'customers'));
      const totalCustomers = customersSnap.size;

      // 3. Fetch all transactions and aggregate gave/got
      const transactionsSnap = await getDocs(collection(db, 'transactions'));
      let totalGave = 0;
      let totalGot = 0;
      transactionsSnap.forEach(doc => {
        const tx = doc.data();
        if (tx.type === 'gave') totalGave += parseFloat(tx.amount || 0);
        else if (tx.type === 'got') totalGot += parseFloat(tx.amount || 0);
      });
      const netReceivables = totalGave - totalGot;

      // 4. Fetch open support tickets
      const ticketsQuery = query(collection(db, 'supportTickets'), where('status', '==', 'open'));
      const ticketsSnap = await getDocs(ticketsQuery);
      const openTicketsCount = ticketsSnap.size;

      setMetrics({
        totalUsers: fetchedMerchants.length,
        totalCustomers,
        totalGave,
        totalGot,
        netReceivables,
        openTicketsCount,
      });
      setMerchants(fetchedMerchants);
    } catch (error) {
      console.error('Error loading admin dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatActiveTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0 min';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const filteredMerchants = merchants.filter(m => 
    (m.businessName && m.businessName.toLowerCase().includes(search.toLowerCase())) || 
    (m.email && m.email.toLowerCase().includes(search.toLowerCase())) ||
    (m.businessPhone && m.businessPhone.includes(search))
  );

  // Calculate Aggregates for Survey Analytics
  const getSurveyStats = () => {
    const stats = {
      types: {},
      positions: {},
      referrals: {},
      purposes: {},
      countries: {}
    };

    let surveyCount = 0;

    merchants.forEach(m => {
      if (m.survey) {
        surveyCount++;
        const t = m.survey.businessType || 'Not answered';
        const p = m.survey.position || 'Not answered';
        const r = m.survey.referralSource || 'Not answered';
        const purp = m.survey.purpose || 'Not answered';
        const c = m.survey.country || 'Not answered';

        stats.types[t] = (stats.types[t] || 0) + 1;
        stats.positions[p] = (stats.positions[p] || 0) + 1;
        stats.referrals[r] = (stats.referrals[r] || 0) + 1;
        stats.purposes[purp] = (stats.purposes[purp] || 0) + 1;
        stats.countries[c] = (stats.countries[c] || 0) + 1;
      }
    });

    return { stats, surveyCount };
  };

  const { stats, surveyCount } = getSurveyStats();

  const handleOpenMerchant = (merchant) => {
    setSelectedMerchant(merchant);
    setMerchantModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Admin stats */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.statsContainer}
      >
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Merchants</Text>
          <Text style={styles.statValue}>{metrics.totalUsers}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Customers</Text>
          <Text style={styles.statValue}>{metrics.totalCustomers}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Net Outstanding</Text>
          <Text style={[styles.statValue, { color: COLORS.danger }]}>
            ${metrics.netReceivables.toLocaleString()}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Open Tickets</Text>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>{metrics.openTicketsCount}</Text>
        </View>
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'merchants' && styles.tabBtnActive]}
          onPress={() => setActiveTab('merchants')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'merchants' && styles.tabBtnTextActive]}>Registered Stores</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'analytics' && styles.tabBtnActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'analytics' && styles.tabBtnTextActive]}>Survey Analytics ({surveyCount})</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'merchants' ? (
        <>
          {/* Merchant list header */}
          <View style={styles.listHeader}>
            <View style={styles.searchBar}>
              <Icon name="search" size={20} color={COLORS.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stores/merchants..."
                placeholderTextColor={COLORS.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {loading && merchants.length === 0 ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} size="large" />
          ) : (
            <FlatList
              data={filteredMerchants}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.listContent}
              onRefresh={loadDashboard}
              refreshing={loading}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.merchantCard} onPress={() => handleOpenMerchant(item)}>
                  <View style={styles.cardLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(item.businessName || item.email || 'BB').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.infoWrapper}>
                      <Text style={styles.merchantName}>{item.businessName || 'Merchant'}</Text>
                      <Text style={styles.merchantSub}>{item.email}</Text>
                      {item.businessPhone ? <Text style={styles.merchantPhone}>{item.businessPhone}</Text> : null}
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.activeLabel}>Active Session</Text>
                    <Text style={styles.activeValue}>{formatActiveTime(item.dailyActiveSeconds)}</Text>
                    <Text style={styles.registeredDate}>
                      Reg: {item.createdAt ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      ) : (
        <ScrollView style={styles.analyticsScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.analyticsOverview}>Overview of onboarding survey responses collected from merchants.</Text>

          {/* Business Type stats */}
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Store Categories</Text>
            {Object.entries(stats.types).map(([key, val]) => (
              <View key={key} style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>{key}</Text>
                <Text style={styles.analyticsValue}>{val} ({Math.round(val / surveyCount * 100)}%)</Text>
              </View>
            ))}
          </View>

          {/* Positions stats */}
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>User Roles / Positions</Text>
            {Object.entries(stats.positions).map(([key, val]) => (
              <View key={key} style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>{key}</Text>
                <Text style={styles.analyticsValue}>{val} ({Math.round(val / surveyCount * 100)}%)</Text>
              </View>
            ))}
          </View>

          {/* Referrals stats */}
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Referral Channels</Text>
            {Object.entries(stats.referrals).map(([key, val]) => (
              <View key={key} style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>{key}</Text>
                <Text style={styles.analyticsValue}>{val} ({Math.round(val / surveyCount * 100)}%)</Text>
              </View>
            ))}
          </View>

          {/* Countries stats */}
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Geographical Distribution</Text>
            {Object.entries(stats.countries).map(([key, val]) => (
              <View key={key} style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>{key}</Text>
                <Text style={styles.analyticsValue}>{val} ({Math.round(val / surveyCount * 100)}%)</Text>
              </View>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Detailed Merchant Modal */}
      {selectedMerchant && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={merchantModalVisible}
          onRequestClose={() => setMerchantModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Merchant Profile Detail</Text>
              
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.modalAvatarContainer}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {(selectedMerchant.businessName || selectedMerchant.email || 'BB').substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.modalBizName}>{selectedMerchant.businessName || 'Business Store'}</Text>
                  <Text style={styles.modalSub}>{selectedMerchant.email}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeader}>Business Details</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Contact Phone</Text>
                    <Text style={styles.detailValue}>{selectedMerchant.businessPhone || 'Not provided'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Store Address</Text>
                    <Text style={styles.detailValue}>{selectedMerchant.businessAddress || 'Not provided'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Onboarded On</Text>
                    <Text style={styles.detailValue}>
                      {selectedMerchant.createdAt ? new Date(selectedMerchant.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                    </Text>
                  </View>
                </View>

                {selectedMerchant.survey ? (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionHeader}>Survey Details</Text>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Country & City</Text>
                      <Text style={styles.detailValue}>
                        {selectedMerchant.survey.country || 'N/A'}, {selectedMerchant.survey.city || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Category Tag</Text>
                      <Text style={styles.detailValue}>{selectedMerchant.survey.businessType || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>User Role/Position</Text>
                      <Text style={styles.detailValue}>{selectedMerchant.survey.position || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Referral Source</Text>
                      <Text style={styles.detailValue}>{selectedMerchant.survey.referralSource || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Core Purpose</Text>
                      <Text style={styles.detailValue}>{selectedMerchant.survey.purpose || 'N/A'}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionHeader}>Survey Details</Text>
                    <Text style={styles.noSurveyText}>Merchant registered before onboarding survey phase.</Text>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeader}>Application Metrics</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Daily Active Time</Text>
                    <Text style={styles.detailValue}>{formatActiveTime(selectedMerchant.dailyActiveSeconds)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Display Language</Text>
                    <Text style={styles.detailValue}>{selectedMerchant.language || 'English (default)'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Default Currency</Text>
                    <Text style={styles.detailValue}>{selectedMerchant.currency || 'USD (default)'}</Text>
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setMerchantModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>Close Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  statsContainer: { paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md, gap: 12, height: 110 },
  statCard: { width: 130, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusLg, padding: SIZES.md, ...SHADOWS.sm, justifyContent: 'center' },
  statLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', marginHorizontal: 16, borderRadius: 24, padding: 3, marginBottom: 8 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20 },
  tabBtnActive: { backgroundColor: COLORS.white, ...SHADOWS.sm },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
  tabBtnTextActive: { color: COLORS.primary, fontWeight: '700' },
  listHeader: { paddingHorizontal: SIZES.lg, marginTop: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusLg, paddingHorizontal: SIZES.md, height: 44, ...SHADOWS.sm, marginBottom: SIZES.sm },
  searchInput: { flex: 1, marginLeft: SIZES.sm, fontSize: 13, color: COLORS.text },
  listContent: { paddingHorizontal: SIZES.lg, paddingBottom: 20 },
  merchantCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, padding: SIZES.md, borderRadius: SIZES.radiusLg, marginBottom: SIZES.sm, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  infoWrapper: { flex: 1 },
  merchantName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  merchantSub: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  merchantPhone: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', minWidth: 80 },
  activeLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  activeValue: { fontSize: 13, fontWeight: '800', color: COLORS.success, marginTop: 1 },
  registeredDate: { fontSize: 9, color: COLORS.textLight, marginTop: 4 },
  
  // Analytics tab styles
  analyticsScroll: { flex: 1, paddingHorizontal: 16 },
  analyticsOverview: { fontSize: 12, color: COLORS.textLight, marginBottom: 16 },
  analyticsCard: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, marginBottom: 12, ...SHADOWS.sm },
  analyticsTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 6 },
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#FAFBFC' },
  analyticsLabel: { fontSize: 12, color: COLORS.text, fontWeight: '500' },
  analyticsValue: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, width: '95%', maxHeight: '90%', ...SHADOWS.lg },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  modalScroll: { marginBottom: 16 },
  modalAvatarContainer: { alignItems: 'center', marginBottom: 20 },
  modalAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  modalAvatarText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 20 },
  modalBizName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  modalSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  modalSection: { marginBottom: 16, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: COLORS.text, marginBottom: 8, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 4 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  detailValue: { fontSize: 12, color: COLORS.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  noSurveyText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic', paddingVertical: 6 },
  modalCloseBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 24, alignItems: 'center', ...SHADOWS.sm },
  modalCloseBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
