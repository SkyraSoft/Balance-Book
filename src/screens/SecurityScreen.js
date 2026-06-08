import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function SecurityScreen() {
  const [appLock, setAppLock] = React.useState(false);
  const [biometric, setBiometric] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Manage your account protection and access</Text>
        <View style={styles.encryptBox}>
          <Icon name="lock" size={32} color="#2c7da0" />
          <Text style={styles.encryptTitle}>Your data is secured</Text>
          <Text style={styles.encryptText}>We use 256-bit AES encryption to ensure your financial ledgers remain private.</Text>
        </View>

        <SettingRow label="App Lock" value={appLock} onToggle={() => setAppLock(!appLock)} />
        <SettingRow label="Biometric Unlock" value={biometric} onToggle={() => setBiometric(!biometric)} />

        <Text style={styles.subheader}>ACCOUNT ACCESS</Text>
        <TouchableOpacity style={styles.pinBtn}><Text>123  Change PIN</Text></TouchableOpacity>
        <TouchableOpacity style={styles.pinBtn}><Text>****  Reset Password</Text></TouchableOpacity>

        <Text style={styles.trusted}>Trusted by 2M+ merchants worldwide</Text>
      </View>
    </View>
  );
}

const SettingRow = ({ label, value, onToggle }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch value={value} onValueChange={onToggle} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  encryptBox: { backgroundColor: '#e9ecef', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
  encryptTitle: { fontWeight: 'bold', marginTop: 8 },
  encryptText: { fontSize: 12, textAlign: 'center', marginTop: 4, color: '#666' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowLabel: { fontSize: 16 },
  subheader: { fontWeight: '600', marginTop: 16, marginBottom: 8, color: '#666' },
  pinBtn: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  trusted: { textAlign: 'center', marginTop: 20, fontSize: 12, color: '#888' },
});
