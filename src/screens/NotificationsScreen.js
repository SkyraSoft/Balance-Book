import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import Header from '../components/Header';

export default function NotificationsScreen() {
  const { settings, updateSettings } = useData();

  const toggleSetting = async (key) => {
    await updateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleSetFrequency = async (freq) => {
    await updateSettings({
      ...settings,
      reminderFrequency: freq,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Manage how you and your customers receive updates.</Text>
  
          <SettingRow 
            label="Payment Reminders" 
            value={settings.paymentReminders || false} 
            onToggle={() => toggleSetting('paymentReminders')} 
          />
          <SettingRow 
            label="Daily Summary Alerts" 
            value={settings.dailySummary || false} 
            onToggle={() => toggleSetting('dailySummary')} 
          />
          <SettingRow 
            label="App System Updates" 
            value={settings.appUpdates || false} 
            onToggle={() => toggleSetting('appUpdates')} 
          />
  
          <Text style={styles.label}>Reminder Frequency</Text>
          <View style={styles.freqRow}>
            {['daily', 'weekly', 'monthly'].map((freq) => (
              <TouchableOpacity 
                key={freq}
                style={[
                  styles.freqBtn, 
                  settings.reminderFrequency === freq && styles.freqBtnActive
                ]}
                onPress={() => handleSetFrequency(freq)}
              >
                <Text style={[
                  styles.freqText, 
                  settings.reminderFrequency === freq && styles.freqTextActive
                ]}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>Reminders are sent automatically at 10 AM local time.</Text>
          <Text style={styles.encrypt}>🔒 Premium end-to-end encryption for every notification</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const SettingRow = ({ label, value, onToggle }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch 
      value={value} 
      onValueChange={onToggle} 
      trackColor={{ false: '#ddd', true: COLORS.primary }} 
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16, ...SHADOWS.sm },
  title: { fontSize: 14, color: COLORS.text, marginBottom: 20, fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowLabel: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  label: { fontWeight: '700', marginTop: 20, marginBottom: 8, fontSize: 11, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  freqRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  freqBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
  },
  freqBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  freqText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  freqTextActive: {
    color: COLORS.white,
  },
  hint: { fontSize: 12, color: COLORS.textMuted, marginTop: 12 },
  encrypt: { fontSize: 12, color: COLORS.textMuted, marginTop: 20, textAlign: 'center' },
});
