import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Header from '../components/Header';

export default function HomeScreen({ navigation }) {
  const { customers, transactions, getTranslation, getCurrencySymbol, settings } = useData();
  const [activeTab, setActiveTab] = useState('debtors'); // 'debtors' or 'creditors'
  const [searchQuery, setSearchQuery] = useState('');

  // Filter based on balances (Gave < 0 means they owe us -> debtors; Got > 0 means we owe them -> creditors)
  const topDebtors = [...customers]
    .filter(c => c.balance < 0)
    .sort((a, b) => a.balance - b.balance) // Most negative first
    .slice(0, 5);

  const topCreditors = [...customers]
    .filter(c => c.balance > 0)
    .sort((a, b) => b.balance - a.balance) // Most positive first
    .slice(0, 5);

  const activeList = activeTab === 'debtors' ? topDebtors : topCreditors;

  // Search filter
  const searchResults = searchQuery
    ? customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Calculate totals
  const totalIn = customers.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0);
  const totalOut = customers.filter(c => c.balance < 0).reduce((sum, c) => sum + Math.abs(c.balance), 0);

  // --- Compute Weekly Ledger Trend (Previous, Current, Coming 1, Coming 2) ---
  const calculateWeeklyTrend = () => {
    const today = new Date();
    
    // Helper to get start and end dates
    const getWeekRange = (offsetWeeks) => {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay() + 1 + (offsetWeeks * 7)); // Monday start
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    };

    const prevRange = getWeekRange(-1);
    const currRange = getWeekRange(0);

    const prevTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= prevRange.start && d <= prevRange.end;
    });

    const currTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= currRange.start && d <= currRange.end;
    });

    const prevGave = prevTxs.filter(t => t.type === 'gave').reduce((s, t) => s + t.amount, 0);
    const prevGot = prevTxs.filter(t => t.type === 'got').reduce((s, t) => s + t.amount, 0);

    const currGave = currTxs.filter(t => t.type === 'gave').reduce((s, t) => s + t.amount, 0);
    const currGot = currTxs.filter(t => t.type === 'got').reduce((s, t) => s + t.amount, 0);

    // Coming weeks predictions based on outstanding debts and due dates
    const coming1Due = transactions.filter(t => {
      if (t.type !== 'gave' || t.status !== 'pending' || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      const range = getWeekRange(1);
      return d >= range.start && d <= range.end;
    }).reduce((s, t) => s + t.amount, 0);

    const coming2Due = transactions.filter(t => {
      if (t.type !== 'gave' || t.status !== 'pending' || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      const range = getWeekRange(2);
      return d >= range.start && d <= range.end;
    }).reduce((s, t) => s + t.amount, 0);

    // Heuristics for predictions
    const coming1Gave = Math.round(currGave * 0.9);
    const coming1Got = Math.round(coming1Due + (currGot * 0.8));

    const coming2Gave = Math.round(currGave * 0.85);
    const coming2Got = Math.round(coming2Due + (currGot * 0.75));

    return [
      { label: 'Prev Week', gave: prevGave, got: prevGot },
      { label: 'This Week', gave: currGave, got: currGot },
      { label: 'Next Week', gave: coming1Gave, got: coming1Got, isForecast: true },
      { label: 'Week +2', gave: coming2Gave, got: coming2Got, isForecast: true },
    ];
  };

  const trendData = calculateWeeklyTrend();

  // Helper to map amounts to height percentage
  const maxVal = Math.max(...trendData.flatMap(d => [d.gave, d.got]), 1000);
  const getBarHeight = (val) => {
    return `${Math.max(10, Math.min(100, (val / maxVal) * 100))}%`;
  };

  return (
    <View style={styles.outerContainer}>
      <Header />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.dashboardContainer}>
          
          {/* Customer Search Bar */}
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color={COLORS.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers by name..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="clear" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Search Results / Summary Panels */}
          {searchQuery ? (
            <View style={styles.searchResultsPanel}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              {searchResults.length > 0 ? (
                searchResults.map(customer => (
                  <TouchableOpacity 
                    key={customer.id || customer._id} 
                    style={styles.searchResultItem}
                    onPress={() => {
                      setSearchQuery('');
                      navigation.navigate('CustomersTab', { screen: 'CustomerDetail', params: { customerId: customer.id || customer._id }});
                    }}
                  >
                    <View style={styles.debtorAvatar}>
                      <Text style={styles.debtorAvatarText}>{customer.name.substring(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={styles.debtorInfo}>
                      <Text style={styles.debtorName}>{customer.name}</Text>
                      <Text style={styles.debtorSub}>{customer.phone || 'No mobile'}</Text>
                    </View>
                    <Text style={[styles.debtorAmount, customer.balance > 0 ? { color: COLORS.success } : { color: COLORS.danger }]}>
                      {getCurrencySymbol()}{Math.abs(customer.balance).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>No customers found matching "{searchQuery}"</Text>
              )}
            </View>
          ) : (
            <>
              {/* Summary Cards */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { borderLeftColor: COLORS.success }]}>
                  <View style={styles.summaryHeader}>
                    <Text style={styles.summaryLabel}>{getTranslation('totalIn')}</Text>
                    <View style={styles.badgeGreen}>
                      <Text style={styles.badgeGreenText}>Got</Text>
                    </View>
                  </View>
                  <Text style={[styles.summaryAmount, { color: COLORS.success }]}>
                    {getCurrencySymbol()}{totalIn.toLocaleString()}
                  </Text>
                </View>

                <View style={[styles.summaryCard, { borderLeftColor: COLORS.danger }]}>
                  <View style={styles.summaryHeader}>
                    <Text style={styles.summaryLabel}>{getTranslation('totalOut')}</Text>
                    <View style={styles.badgeRed}>
                      <Text style={styles.badgeRedText}>Gave</Text>
                    </View>
                  </View>
                  <Text style={[styles.summaryAmount, { color: COLORS.danger }]}>
                    {getCurrencySymbol()}{totalOut.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.btnBlue]}
                  onPress={() => navigation.navigate('Reports')}
                >
                  <Icon name="picture-as-pdf" size={18} color="#2c7da0" />
                  <Text style={[styles.actionBtnText, { color: '#2c7da0' }]}>Download PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.btnGreen]}
                  onPress={() => navigation.navigate('Reports')}
                >
                  <MaterialCommunityIcons name="whatsapp" size={18} color={COLORS.white} />
                  <Text style={[styles.actionBtnText, { color: COLORS.white }]}>WhatsApp</Text>
                </TouchableOpacity>
              </View>

              {/* Weekly Ledger Trend Chart (Tapping navigates to WeeklyTrend screen) */}
              <TouchableOpacity 
                style={styles.chartCard} 
                onPress={() => navigation.navigate('WeeklyTrend')}
              >
                <View style={styles.chartHeader}>
                  <View>
                    <Text style={styles.chartTitle}>Weekly Ledger Flow</Text>
                    <Text style={styles.chartSubtitle}>Continuous vector view of credit flows</Text>
                  </View>
                  <Icon name="insert-chart" size={24} color={COLORS.primary} />
                </View>
                
                <View style={styles.chartArea}>
                  {trendData.map((col, index) => (
                    <View key={index} style={styles.chartColumn}>
                      <View style={styles.barsContainer}>
                        <View style={[styles.barOut, { height: getBarHeight(col.gave) }, col.isForecast && styles.barPredicted]} />
                        <View style={[styles.barIn, { height: getBarHeight(col.got) }, col.isForecast && styles.barPredicted]} />
                      </View>
                      <Text style={styles.chartLabel} numberOfLines={1}>{col.label}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
                    <Text style={styles.legendText}>Gave (Credit)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                    <Text style={styles.legendText}>Got (Payments)</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Debtors vs Creditors Toggle Tabs */}
              <View style={styles.tabsWrapper}>
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'debtors' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('debtors')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'debtors' && styles.tabButtonTextActive]}>
                    {getTranslation('topDebtors')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'creditors' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('creditors')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'creditors' && styles.tabButtonTextActive]}>
                    {getTranslation('topCreditors')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Active Ledger Summary List */}
              <View style={styles.debtorsList}>
                {activeList.length > 0 ? activeList.map((customer, idx) => (
                  <TouchableOpacity 
                    key={customer.id || customer._id} 
                    style={[styles.debtorItem, idx < activeList.length - 1 && styles.debtorBorder]}
                    onPress={() => navigation.navigate('CustomersTab', { screen: 'CustomerDetail', params: { customerId: customer.id || customer._id }})}
                  >
                    <View style={styles.debtorAvatar}>
                      <Text style={styles.debtorAvatarText}>{customer.name.substring(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={styles.debtorInfo}>
                      <Text style={styles.debtorName}>{customer.name}</Text>
                      <Text style={styles.debtorSub}>Last entry: {idx === 0 ? '2 days ago' : idx === 1 ? 'Yesterday' : 'Today'}</Text>
                    </View>
                    <Text style={[styles.debtorAmount, { color: activeTab === 'debtors' ? COLORS.danger : COLORS.success }]}>
                      {getCurrencySymbol()}{Math.abs(customer.balance).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                )) : (
                  <View style={styles.debtorItem}>
                    <Text style={styles.debtorSub}>
                      {activeTab === 'debtors' ? getTranslation('noDebtors') : getTranslation('noCreditors')}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  container: {
    flex: 1,
  },
  dashboardContainer: {
    paddingHorizontal: SIZES.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.md,
    height: 48,
    ...SHADOWS.sm,
    marginTop: SIZES.md,
    marginBottom: SIZES.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: SIZES.sm,
    fontSize: 14,
    color: COLORS.text,
  },
  searchResultsPanel: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    marginTop: SIZES.xs,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  noResultsText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
    paddingVertical: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  badgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeGreenText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: 'bold',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeRedText: {
    color: COLORS.danger,
    fontSize: 9,
    fontWeight: 'bold',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: SIZES.radiusLg,
    ...SHADOWS.sm,
  },
  btnBlue: {
    backgroundColor: '#E0F2FE',
  },
  btnGreen: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 13,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  chartSubtitle: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    paddingTop: SIZES.md,
  },
  chartColumn: {
    alignItems: 'center',
    width: 60,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 70,
    width: '100%',
    justifyContent: 'center',
    gap: 4,
  },
  barOut: {
    width: 10,
    backgroundColor: COLORS.danger,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  barIn: {
    width: 10,
    backgroundColor: COLORS.success,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  barPredicted: {
    opacity: 0.5,
    borderStyle: 'dashed',
  },
  chartLabel: {
    fontSize: 9,
    color: COLORS.textLight,
    marginTop: 6,
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  tabsWrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    padding: 2,
    backgroundColor: '#F1F5F9',
    marginVertical: SIZES.md,
  },
  tabButton: {
    flex: 1,
    height: 36,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  debtorsList: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    marginBottom: SIZES.md,
  },
  debtorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  debtorBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  debtorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  debtorAvatarText: {
    color: '#0369A1',
    fontWeight: 'bold',
    fontSize: 13,
  },
  debtorInfo: {
    flex: 1,
  },
  debtorName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  debtorSub: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  debtorAmount: {
    fontSize: 15,
    fontWeight: '800',
  },

  // Modal analysis details
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
    marginTop: 12,
    marginBottom: 8,
  },
  modalScroll: {
    marginVertical: 12,
  },
  modalWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalWeekLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalAmountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalAmountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalAnalysisText: {
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
    marginTop: 16,
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
