import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import Header from '../components/Header';

export default function ExportDataScreen() {
  const { transactions, customers, getCurrencySymbol, settings } = useData();
  const [format, setFormat] = useState('pdf');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const currencySymbol = getCurrencySymbol();
      let tableRows = '';

      transactions.forEach((t, index) => {
        const customerName = customers.find(c => (c.id === t.customerId || c._id === t.customerId))?.name || 'Unknown';
        const dateStr = new Date(t.date).toLocaleDateString();
        const typeLabel = t.type === 'gave' ? 'GAVE (Credit)' : 'GOT (Received)';
        const amountColor = t.type === 'gave' ? '#dc3545' : '#198754';
        
        tableRows += `
          <tr style="background-color: ${index % 2 === 0 ? '#fcfcfc' : '#ffffff'};">
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${dateStr}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${customerName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${amountColor}; font-weight: bold;">${typeLabel}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${currencySymbol}${t.amount.toLocaleString()}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${t.note || '-'}</td>
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
            .title { font-size: 18px; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 20px; }
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
                <div style="font-size: 11px; color: #888;">Complete Credit Ledger Logs</div>
              </td>
              <td class="business-details">
                <div>Phone: ${settings.businessPhone || '-'}</div>
                <div>Address: ${settings.businessAddress || '-'}</div>
              </td>
            </tr>
          </table>

          <div class="title">Complete Ledger Statement Records</div>

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
              ${tableRows || '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">No transaction entries found.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Powered by Balance Book Secure Encryption
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate statement export.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Generate a complete summary statement of your ledger transactions.</Text>

          <Text style={styles.label}>Select Format</Text>
          <View style={styles.formatRow}>
            <TouchableOpacity 
              style={[styles.formatBtn, styles.formatBtnSpacing, format === 'pdf' && styles.activeFormat]} 
              onPress={() => setFormat('pdf')}
            >
              <Icon name="picture-as-pdf" size={24} color={format === 'pdf' ? '#fff' : '#2c7da0'} />
              <Text style={[styles.formatText, format === 'pdf' && { color: '#fff' }]}>PDF Report</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} size="large" />
          ) : (
            <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
              <Text style={styles.exportBtnText}>Export & Share Statement</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.recentTitle}>RECENT EXPORTS</Text>
          <View style={styles.recentItem}><Text style={styles.recentText}>Ledger_Statement_Summary.pdf - Just Now • 4.5 MB</Text></View>
          <View style={styles.recentItem}><Text style={styles.recentText}>Monthly_Ledger.xlsx - Oct 30, 2023 • 1.2 MB</Text></View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16, ...SHADOWS.sm },
  title: { fontSize: 14, color: COLORS.text, marginBottom: 20, fontWeight: '500', lineHeight: 20 },
  label: { fontWeight: '700', marginTop: 16, marginBottom: 8, fontSize: 11, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  formatRow: { flexDirection: 'row' },
  formatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2c7da0', padding: 12, borderRadius: 12, gap: 8 },
  formatBtnSpacing: { marginRight: 12 },
  activeFormat: { backgroundColor: '#2c7da0' },
  formatText: { color: '#2c7da0', fontWeight: '700', fontSize: 13 },
  exportBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 24, ...SHADOWS.sm },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  recentTitle: { marginTop: 28, fontWeight: '700', fontSize: 11, color: COLORS.textLight, letterSpacing: 0.5, marginBottom: 8 },
  recentItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  recentText: { fontSize: 12, color: COLORS.text, fontWeight: '500' },
});
