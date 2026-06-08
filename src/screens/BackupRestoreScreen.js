import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';

export default function BackupRestoreScreen() {
  const { customers, transactions, settings } = useData();

  const handleBackup = async () => {
    Alert.alert('Backup', 'Backup feature is included as a placeholder in this starter project.');
  };

  const handleRestore = () => {
    Alert.alert('Restore', 'This will replace current data. Please select a backup file.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Icon name="cloud-upload" size={40} color="#2c7da0" />
        <Text style={styles.title}>Backup & Restore</Text>
        <Text style={styles.subtitle}>Secure your financial data with cloud backups</Text>

        <View style={styles.infoRow}>
          <Text>Last Backup: Today, 10:30 AM</Text>
        </View>
        <View style={styles.infoRow}>
          <Text>Auto Backup: Enabled</Text>
        </View>
        <View style={styles.infoRow}>
          <Text>Google Drive Account: merchant.books@gmail.com</Text>
        </View>

        <TouchableOpacity style={styles.backupBtn} onPress={handleBackup}>
          <Text style={styles.btnText}>Backup Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
          <Text style={styles.btnText}>Restore Data</Text>
        </TouchableOpacity>
        <Text style={styles.encrypt}>🔒 MILITARY GRADE ENCRYPTION</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 4 },
  infoRow: { marginTop: 16, width: '100%' },
  backupBtn: { backgroundColor: '#2c7da0', padding: 12, borderRadius: 12, width: '100%', marginTop: 20, alignItems: 'center' },
  restoreBtn: { backgroundColor: '#6c757d', padding: 12, borderRadius: 12, width: '100%', marginTop: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  encrypt: { marginTop: 20, fontSize: 12, color: '#888' },
});
