import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';

export default function ExportDataScreen() {
  const { transactions, customers } = useData();
  const [format, setFormat] = useState('excel');
  const [includeAttachments, setIncludeAttachments] = useState(false);

  const handleExport = () => {
    Alert.alert('Export', 'Export feature is included as a placeholder in this starter project.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Generate a summary of your transactions and ledgers.</Text>

        <Text style={styles.label}>Date Range</Text>
        <View style={styles.rangeRow}>
          <TouchableOpacity style={[styles.rangeBtn, styles.rangeBtnSpacing]}><Text>Current Month</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.rangeBtn, styles.rangeBtnSpacing]}><Text>Last 3 Months</Text></TouchableOpacity>
          <TouchableOpacity style={styles.rangeBtn}><Text>Custom</Text></TouchableOpacity>
        </View>

        <Text style={styles.label}>Select Format</Text>
        <View style={styles.formatRow}>
          <TouchableOpacity style={[styles.formatBtn, styles.formatBtnSpacing, format === 'excel' && styles.activeFormat]} onPress={() => setFormat('excel')}>
            <Icon name="description" size={24} color={format === 'excel' ? '#fff' : '#2c7da0'} />
            <Text style={[styles.formatText, format === 'excel' && { color: '#fff' }]}>Excel (.xlsx)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.formatBtn, format === 'pdf' && styles.activeFormat]} onPress={() => setFormat('pdf')}>
            <Icon name="picture-as-pdf" size={24} color={format === 'pdf' ? '#fff' : '#2c7da0'} />
            <Text style={[styles.formatText, format === 'pdf' && { color: '#fff' }]}>PDF</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.attachBtn} onPress={() => setIncludeAttachments(!includeAttachments)}>
          <Icon name={includeAttachments ? 'check-box' : 'check-box-outline-blank'} size={24} color="#2c7da0" />
          <Text style={styles.attachText}>Include Attachments (Bills, receipts and images)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportBtnText}>Export & Share</Text>
        </TouchableOpacity>

        <Text style={styles.recentTitle}>RECENT EXPORTS</Text>
        <View style={styles.recentItem}><Text>October_Ledger.xlsx - Oct 30, 2023 • 1.2 MB</Text></View>
        <View style={styles.recentItem}><Text>Q3_Report_Final.pdf - Oct 12, 2023 • 4.5 MB</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16 },
  title: { fontSize: 16, marginBottom: 20 },
  label: { fontWeight: '600', marginTop: 16, marginBottom: 8 },
  rangeRow: { flexDirection: 'row' },
  rangeBtn: { borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  rangeBtnSpacing: { marginRight: 12 },
  formatRow: { flexDirection: 'row' },
  formatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2c7da0', padding: 10, borderRadius: 12 },
  formatBtnSpacing: { marginRight: 12 },
  activeFormat: { backgroundColor: '#2c7da0' },
  formatText: { color: '#2c7da0' },
  attachBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  attachText: { marginLeft: 8 },
  exportBtn: { backgroundColor: '#2c7da0', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  exportBtnText: { color: '#fff', fontWeight: '600' },
  recentTitle: { marginTop: 24, fontWeight: '600', marginBottom: 8 },
  recentItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
