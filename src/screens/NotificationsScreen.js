import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useData } from '../context/DataContext';

export default function NotificationsScreen() {
  const { settings, updateSettings } = useData();

  const toggleSetting = (key) => {
    updateSettings({
      ...settings,
      notifications: { ...settings.notifications, [key]: !settings.notifications[key] },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Manage how you and your customers receive updates.</Text>

        <SettingRow label="Payment Reminders" value={settings.notifications.paymentReminders} onToggle={() => toggleSetting('paymentReminders')} />
        <SettingRow label="Daily Summary" value={settings.notifications.dailySummary} onToggle={() => toggleSetting('dailySummary')} />
        <SettingRow label="SMS Alerts" value={settings.notifications.smsAlerts} onToggle={() => toggleSetting('smsAlerts')} />
        <SettingRow label="App Updates" value={settings.notifications.appUpdates} onToggle={() => toggleSetting('appUpdates')} />

        <Text style={styles.label}>Reminder Frequency</Text>
        <View style={styles.freqRow}>
          <Text style={[styles.freqText, styles.freqTextSpacing]}>Daily</Text>
          <Text style={styles.freqText}>Weekly</Text>
        </View>
        <Text style={styles.hint}>Reminders are sent automatically at 10 AM local time.</Text>
        <Text style={styles.encrypt}>🔒 Premium end-to-end encryption for every notification</Text>
      </View>
    </ScrollView>
  );
}

const SettingRow = ({ label, value, onToggle }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch value={value} onValueChange={onToggle} trackColor={{ false: '#ddd', true: '#2c7da0' }} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16 },
  title: { fontSize: 16, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowLabel: { fontSize: 16 },
  label: { fontWeight: '600', marginTop: 20, marginBottom: 8 },
  freqRow: { flexDirection: 'row' },
  freqText: { fontSize: 14, color: '#2c7da0' },
  freqTextSpacing: { marginRight: 20 },
  hint: { fontSize: 12, color: '#888', marginTop: 12 },
  encrypt: { fontSize: 12, color: '#888', marginTop: 20, textAlign: 'center' },
});
