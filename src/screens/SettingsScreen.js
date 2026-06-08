import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';

export default function SettingsScreen({ navigation }) {
  const { settings } = useData();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.businessName}>{settings.businessName}</Text>
        <Text style={styles.businessPhone}>{settings.businessPhone}</Text>
        <Text style={styles.businessAddress}>{settings.businessAddress}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('BusinessProfile')}>
          <Text style={styles.editBtnText}>Edit Business Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <MenuItem icon="backup" title="Backup & Restore" onPress={() => navigation.navigate('BackupRestore')} />
        <MenuItem icon="file-download" title="Export Data (Excel/PDF)" onPress={() => navigation.navigate('ExportData')} />
        <MenuItem icon="notifications" title="Notification Settings" onPress={() => navigation.navigate('NotificationsSettings')} />
        <MenuItem icon="security" title="Security / App Lock" onPress={() => navigation.navigate('SecuritySettings')} />
        <MenuItem icon="language" title="App Language (English/Urdu)" onPress={() => {}} />
        <MenuItem icon="info" title="About Khata Ledger" onPress={() => {}} />
      </View>

      <TouchableOpacity style={styles.logoutBtn}>
        <Icon name="logout" size={20} color="#dc3545" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 2.4.0 (Gold)</Text>
    </ScrollView>
  );
}

const MenuItem = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Icon name={icon} size={24} color="#2c7da0" />
    <Text style={styles.menuText}>{title}</Text>
    <Icon name="chevron-right" size={20} color="#aaa" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  profileCard: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16, alignItems: 'center', elevation: 2 },
  businessName: { fontSize: 18, fontWeight: 'bold' },
  businessPhone: { fontSize: 14, color: '#666', marginTop: 4 },
  businessAddress: { fontSize: 12, color: '#888', marginTop: 2, textAlign: 'center' },
  editBtn: { marginTop: 12, borderWidth: 1, borderColor: '#2c7da0', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  editBtnText: { color: '#2c7da0' },
  menuSection: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { flex: 1, marginLeft: 12, fontSize: 16 },
  logoutBtn: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, padding: 16, borderRadius: 12, justifyContent: 'center', marginBottom: 20 },
  logoutText: { color: '#dc3545', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  version: { textAlign: 'center', color: '#888', marginBottom: 30 },
});
