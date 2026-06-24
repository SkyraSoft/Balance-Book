import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Picker } from '@react-native-picker/picker';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Header from '../components/Header';
import { Platform } from 'react-native';

export default function ReportsScreen() {
  const { customers, transactions, getTranslation, getCurrencySymbol, settings } = useData();
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [dayDetailModalVisible, setDayDetailModalVisible] = useState(false);
  const [selectedDayTxs, setSelectedDayTxs] = useState([]);
  const [selectedDayLabel, setSelectedDayLabel] = useState('');
  
  // Filtering modes
  const [filterMode, setFilterMode] = useState('ALL_TIME');
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);

  // Format month and year label
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getReportTitle = () => {
    if (filterMode === 'ALL_TIME') return 'All Time Analysis';
    if (filterMode === 'CURRENT_MONTH') {
      const now = new Date();
      return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const selectedMonthLabel = getReportTitle();

  // Filter transactions based on dropdown selection
  const getFilteredTransactions = () => {
    if (filterMode === 'ALL_TIME') {
      return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    let targetYear, targetMonth;
    if (filterMode === 'CURRENT_MONTH') {
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth();
    } else {
      targetYear = currentDate.getFullYear();
      targetMonth = currentDate.getMonth();
    }

    return transactions.filter(t => {
      const txDate = new Date(t.date);
      return (
        txDate.getMonth() === targetMonth &&
        txDate.getFullYear() === targetYear
      );
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const filteredTxs = getFilteredTransactions();

  // Stats calculation for the selected filter period
  const totalGiven = filteredTxs.filter(t => t.type === 'gave').reduce((s, t) => s + t.amount, 0);
  const totalReceived = filteredTxs.filter(t => t.type === 'got').reduce((s, t) => s + t.amount, 0);
  const pending = totalGiven - totalReceived;

  // Listen to picker change
  const handleFilterChange = (val) => {
    if (val === 'CUSTOM') {
      setMonthPickerVisible(true);
      // We don't change filterMode to CUSTOM until they actually select it in the modal, 
      // but to keep Picker UI synced, we can set it.
      setFilterMode('CUSTOM');
    } else {
      setFilterMode(val);
    }
  };

  // --- Clickable Calendar Logic ---
  const handleDayPress = (day) => {
    if (!day) return;
    const targetDate = filterMode === 'CURRENT_MONTH' ? new Date() : currentDate;
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const monthStr = (targetDate.getMonth() + 1) < 10 ? `0${targetDate.getMonth() + 1}` : `${targetDate.getMonth() + 1}`;
    const dateString = `${targetDate.getFullYear()}-${monthStr}-${dayStr}`;

    const dayTransactions = transactions.filter(t => {
      const dStr = new Date(t.date).toISOString().split('T')[0];
      return dStr === dateString;
    });

    if (dayTransactions.length === 0) {
      Alert.alert('No Entries', `No ledger transactions logged on ${dateString}`);
      return;
    }

    setSelectedDayTxs(dayTransactions);
    setSelectedDayLabel(new Date(dateString).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    setDayDetailModalVisible(true);
  };

  // Render Calendar visual
  const renderCalendar = () => {
    // Only show calendar for monthly views
    if (filterMode === 'ALL_TIME') return null;

    const targetDate = filterMode === 'CURRENT_MONTH' ? new Date() : currentDate;
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const totalDays = new Date(year, month + 1, 0).getDate();
    const offset = new Date(year, month, 1).getDay(); // Starting weekday offset (0-6)
    const calendarDays = [];

    for (let i = 0; i < offset; i++) {
      calendarDays.push({ day: '', hasGave: false, hasGot: false });
    }

    for (let day = 1; day <= totalDays; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const monthStr = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
      const dateString = `${year}-${monthStr}-${dayStr}`;

      const dayTransactions = transactions.filter(t => {
        const dStr = new Date(t.date).toISOString().split('T')[0];
        return dStr === dateString;
      });

      const hasGave = dayTransactions.some(t => t.type === 'gave');
      const hasGot = dayTransactions.some(t => t.type === 'got');

      calendarDays.push({ day, hasGave, hasGot });
    }

    return (
      <View style={styles.panelCard}>
        <Text style={styles.panelTitle}>Monthly Ledger Activity Calendar</Text>
        <Text style={styles.panelSubtitle}>Taps dates to view daily log. (Red: Credit Out, Green: Cash In)</Text>
        <View style={styles.calendarGrid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((wd, i) => (
            <Text key={i} style={styles.calendarWeekName}>{wd}</Text>
          ))}
          {calendarDays.map((cd, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.calendarCell, cd.day && styles.calendarCellActive]}
              disabled={!cd.day}
              onPress={() => handleDayPress(cd.day)}
            >
              <Text style={[styles.calendarDayText, !cd.day && { color: 'transparent' }]}>{cd.day}</Text>
              <View style={styles.dotRow}>
                {cd.hasGave && <View style={[styles.calDot, { backgroundColor: COLORS.danger }]} />}
                {cd.hasGot && <View style={[styles.calDot, { backgroundColor: COLORS.success }]} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // --- Beautiful PDF Statement Exporter ---
  const handleExportStatement = async () => {
    try {
      const currencySymbol = getCurrencySymbol();
      let tableRows = '';

      filteredTxs.forEach((t, index) => {
        const customerName = customers.find(c => (c.id === t.customerId || c._id === t.customerId))?.name || 'Unknown Store';
        const dateStr = new Date(t.date).toLocaleDateString();
        const typeLabel = t.type === 'gave' ? 'GAVE (Credit)' : 'GOT (Received)';
        const amountColor = t.type === 'gave' ? '#dc3545' : '#198754';
        
        tableRows += `
          <tr style="background-color: ${index % 2 === 0 ? '#fcfcfc' : '#ffffff'};">
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: left;">${dateStr}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: left;">${customerName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: left; color: ${amountColor}; font-weight: bold;">${typeLabel}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${currencySymbol}${t.amount.toLocaleString()}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: left;">${t.note || '-'}</td>
          </tr>
        `;
      });

      const htmlContent = `
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 20px; }
            .header-table { width: 100%; margin-bottom: 30px; border-bottom: 2px solid #0f766e; padding-bottom: 15px; }
            .business-name { font-size: 24px; font-weight: bold; color: #0f766e; }
            .business-details { font-size: 12px; color: #666; text-align: right; }
            .title { font-size: 18px; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 0.5px; }
            .summary-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
            .summary-box { border: 1px solid #ddd; padding: 12px; text-align: center; border-radius: 6px; }
            .summary-label { font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold; margin-bottom: 5px; }
            .summary-val { font-size: 18px; font-weight: bold; }
            .ledger-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .ledger-table th { background-color: #0f766e; color: white; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="business-name">${settings.businessName || 'Balance Book Merchant'}</div>
                <div style="font-size: 11px; color: #888; margin-top: 3px;">Generated via Balance Book Ledger App</div>
              </td>
              <td class="business-details">
                <div>Phone: ${settings.businessPhone || '-'}</div>
                <div>Address: ${settings.businessAddress || '-'}</div>
              </td>
            </tr>
          </table>

          <div class="title">Ledger Report - ${selectedMonthLabel}</div>

          <table class="summary-table">
            <tr>
              <td style="width: 33%; padding: 5px;">
                <div class="summary-box" style="border-left: 4px solid #dc3545;">
                  <div class="summary-label">Total Credit Given</div>
                  <div class="summary-val" style="color: #dc3545;">${currencySymbol}${totalGiven.toLocaleString()}</div>
                </div>
              </td>
              <td style="width: 33%; padding: 5px;">
                <div class="summary-box" style="border-left: 4px solid #198754;">
                  <div class="summary-label">Total Cash Got</div>
                  <div class="summary-val" style="color: #198754;">${currencySymbol}${totalReceived.toLocaleString()}</div>
                </div>
              </td>
              <td style="width: 33%; padding: 5px;">
                <div class="summary-box" style="border-left: 4px solid ${pending >= 0 ? '#dc3545' : '#198754'};">
                  <div class="summary-label">${pending >= 0 ? 'Net Pending Credit' : 'Net Pending Debit'}</div>
                  <div class="summary-val" style="color: ${pending >= 0 ? '#dc3545' : '#198754'};">${currencySymbol}${Math.abs(pending).toLocaleString()}</div>
                </div>
              </td>
            </tr>
          </table>

          <table class="ledger-table">
            <thead>
              <tr>
                <th style="width: 15%;">Date</th>
                <th style="width: 25%;">Customer</th>
                <th style="width: 20%;">Type</th>
                <th style="width: 20%; text-align: right;">Amount</th>
                <th style="width: 20%;">Details</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">No transaction entries recorded for this period.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Thank you for your business! | Powered by Balance Book Secure Encryption
          </div>
        </body>
        </html>
      `;

      setLoading(true);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      setLoading(false);
      await Sharing.shareAsync(uri);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to generate PDF statement report.');
    }
  };

  const [loading, setLoading] = useState(false);

  return (
    <View style={styles.outerContainer}>
      <Header />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Title Header with the new Dropdown Filter */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Financial Reports</Text>
          <Text style={styles.subtitle}>{selectedMonthLabel}</Text>
        </View>
        <View style={styles.dropdownContainer}>
          <Picker
            selectedValue={filterMode}
            onValueChange={handleFilterChange}
            style={styles.pickerStyle}
            dropdownIconColor={COLORS.primary}
            mode="dropdown"
          >
            <Picker.Item label="All Time" value="ALL_TIME" />
            <Picker.Item label="Current Month" value="CURRENT_MONTH" />
            <Picker.Item label="Custom Month..." value="CUSTOM" />
          </Picker>
        </View>
      </View>

      {/* KPI stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.danger }]}>
          <Text style={styles.statLabel}>Total Credit Given</Text>
          <Text style={[styles.statAmount, { color: COLORS.danger }]}>
            {getCurrencySymbol()}{totalGiven.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.success }]}>
          <Text style={styles.statLabel}>Total Cash Got</Text>
          <Text style={[styles.statAmount, { color: COLORS.success }]}>
            {getCurrencySymbol()}{totalReceived.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: pending >= 0 ? COLORS.danger : COLORS.success }]}>
          <Text style={styles.statLabel}>{pending >= 0 ? 'Net Pending Credit' : 'Net Pending Debit'}</Text>
          <Text style={[styles.statAmount, { color: pending >= 0 ? COLORS.danger : COLORS.success }]}>
            {getCurrencySymbol()}{Math.abs(pending).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.textMuted }]}>
          <Text style={styles.statLabel}>Active Accounts</Text>
          <Text style={styles.statAmount}>{customers.length}</Text>
        </View>
      </View>

      {/* Sharing buttons using actual PDF output */}
      <View style={styles.shareRow}>
        <TouchableOpacity style={[styles.shareBtn, styles.btnBlue]} onPress={handleExportStatement}>
          <Icon name="picture-as-pdf" size={18} color="#2c7da0" />
          <Text style={[styles.shareText, { color: '#2c7da0' }]}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.shareBtn, styles.btnGreen]} onPress={handleExportStatement}>
          <MaterialCommunityIcons name="whatsapp" size={18} color={COLORS.white} />
          <Text style={[styles.shareText, { color: COLORS.white }]}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Activity Matrix View (Hidden if All Time) */}
      {renderCalendar()}

      {/* Detailed Transaction Logs Grid Table */}
      <View style={styles.panelCard}>
        <View style={styles.logsHeader}>
          <Text style={styles.panelTitle}>Detailed Transaction History</Text>
          <TouchableOpacity style={styles.downloadLogsBtn} onPress={handleExportStatement}>
            <Icon name="file-download" size={18} color={COLORS.primary} />
            <Text style={styles.downloadLogsBtnText}>Export</Text>
          </TouchableOpacity>
        </View>
        
        {filteredTxs.length === 0 ? (
          <Text style={styles.noLogsText}>No transaction records for this period.</Text>
        ) : (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thText, { width: '25%' }]}>Date</Text>
              <Text style={[styles.thText, { width: '30%' }]}>Customer</Text>
              <Text style={[styles.thText, { width: '20%' }]}>Type</Text>
              <Text style={[styles.thText, { width: '25%', textAlign: 'right' }]}>Amount</Text>
            </View>
            {filteredTxs.slice(0, 10).map((t, idx) => {
              const customerName = customers.find(c => (c.id === t.customerId || c._id === t.customerId))?.name || 'Unknown Store';
              return (
                <View key={t._id || t.id || idx} style={styles.tableBodyRow}>
                  <Text style={[styles.tdText, { width: '25%' }]}>{new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
                  <Text style={[styles.tdText, { width: '30%' }]} numberOfLines={1}>{customerName}</Text>
                  <Text style={[styles.tdText, { width: '20%', color: t.type === 'gave' ? COLORS.danger : COLORS.success, fontWeight: '700' }]}>{t.type === 'gave' ? 'GAVE' : 'GOT'}</Text>
                  <Text style={[styles.tdText, { width: '25%', textAlign: 'right', fontWeight: '800' }]}>{getCurrencySymbol()}{t.amount.toLocaleString()}</Text>
                </View>
              );
            })}
            {filteredTxs.length > 10 && (
              <Text style={styles.moreLogsText}>+ {filteredTxs.length - 10} more transactions logged.</Text>
            )}
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />

      {/* Month & Year Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={monthPickerVisible}
        onRequestClose={() => {
            setMonthPickerVisible(false);
            if (filterMode === 'CUSTOM') setFilterMode('ALL_TIME');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Month & Year</Text>
            
            <View style={styles.yearSelectorRow}>
              <TouchableOpacity onPress={() => {
                const prevYear = new Date(currentDate);
                prevYear.setFullYear(currentDate.getFullYear() - 1);
                setCurrentDate(prevYear);
              }} style={styles.arrowBtn}>
                <Icon name="chevron-left" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.yearLabel}>{currentDate.getFullYear()}</Text>
              <TouchableOpacity onPress={() => {
                const nextYear = new Date(currentDate);
                nextYear.setFullYear(currentDate.getFullYear() + 1);
                setCurrentDate(nextYear);
              }} style={styles.arrowBtn}>
                <Icon name="chevron-right" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.monthsGrid}>
              {monthNames.map((m, idx) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.monthGridCell,
                    currentDate.getMonth() === idx && styles.monthGridCellActive
                  ]}
                  onPress={() => {
                    const newD = new Date(currentDate);
                    newD.setMonth(idx);
                    setCurrentDate(newD);
                    setMonthPickerVisible(false);
                  }}
                >
                  <Text style={[
                    styles.monthGridText,
                    currentDate.getMonth() === idx && styles.monthGridTextActive
                  ]}>
                    {m.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => {
                setMonthPickerVisible(false);
                if (filterMode === 'CUSTOM') setFilterMode('ALL_TIME');
              }}
            >
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Clickable Calendar Day Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={dayDetailModalVisible}
        onRequestClose={() => setDayDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedDayLabel}</Text>
            <Text style={styles.modalSubtitle}>Daily Transaction Entries:</Text>
            
            <FlatList
              data={selectedDayTxs}
              keyExtractor={item => item._id || item.id}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={({ item }) => {
                const custName = customers.find(c => (c.id === item.customerId || c._id === item.customerId))?.name || 'Unknown';
                return (
                  <View style={styles.dayTxCard}>
                    <View>
                      <Text style={styles.dayTxCustName}>{custName}</Text>
                      <Text style={styles.dayTxNote}>{item.note || 'No description details'}</Text>
                    </View>
                    <Text style={[styles.dayTxAmount, { color: item.type === 'gave' ? COLORS.danger : COLORS.success }]}>
                      {item.type === 'gave' ? '-' : '+'}{getCurrencySymbol()}{item.amount.toLocaleString()}
                    </Text>
                  </View>
                );
              }}
            />

            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setDayDetailModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  container: { flex: 1 },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.lg, 
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  dropdownContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    width: 150,
    height: Platform.OS === 'android' ? 50 : 40,
    justifyContent: 'center',
  },
  pickerStyle: {
    width: 150,
    height: Platform.OS === 'android' ? 50 : 40,
    color: COLORS.primary,
  },
  arrowBtn: {
    padding: 2,
  },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: SIZES.md, 
    justifyContent: 'space-between' 
  },
  statCard: { 
    width: '48%', 
    backgroundColor: COLORS.white, 
    marginBottom: SIZES.md, 
    padding: SIZES.md, 
    borderRadius: SIZES.radiusLg, 
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '600', textTransform: 'uppercase' },
  statAmount: { fontSize: 16, fontWeight: '800', marginTop: 6, color: COLORS.text },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
    gap: 12,
  },
  shareBtn: {
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
  shareText: {
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 13,
  },
  panelCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusLg,
    marginHorizontal: SIZES.lg,
    padding: SIZES.lg,
    ...SHADOWS.sm,
    marginBottom: SIZES.lg,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  panelSubtitle: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
    marginBottom: SIZES.md,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarWeekName: {
    width: '13%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    marginBottom: SIZES.sm,
  },
  calendarCell: {
    width: '13%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  calendarCellActive: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 4,
  },
  calDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  downloadLogsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  downloadLogsBtnText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  noLogsText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    paddingVertical: 15,
  },
  tableContainer: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
    marginBottom: 6,
  },
  thText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tdText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  moreLogsText: {
    fontSize: 11,
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 10,
  },
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
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    marginBottom: 8,
  },
  dayTxCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dayTxCustName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayTxNote: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  dayTxAmount: {
    fontSize: 14,
    fontWeight: '800',
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
  yearSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 30,
  },
  yearLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 10,
  },
  monthGridCell: {
    width: '30%',
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  monthGridCellActive: {
    backgroundColor: COLORS.primary,
  },
  monthGridText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  monthGridTextActive: {
    color: COLORS.white,
  },
});
