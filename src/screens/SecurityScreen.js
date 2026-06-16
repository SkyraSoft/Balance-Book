import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import Header from '../components/Header';

export default function SecurityScreen() {
  const { 
    appLockPin, 
    isAppLockEnabled, 
    isBiometricEnabled, 
    updateSettings, 
    settings 
  } = useData();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  const handleToggleAppLock = async (value) => {
    if (value) {
      // Prompt pin creation
      setPinInput('');
      setConfirmPinInput('');
      setPinModalVisible(true);
    } else {
      // Turn off app lock
      await updateSettings({
        ...settings,
        isAppLockEnabled: false,
        appLockPin: '',
      });
      Alert.alert('Security', 'App Lock disabled successfully.');
    }
  };

  const handleSavePin = async () => {
    if (pinInput.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits.');
      return;
    }
    if (pinInput !== confirmPinInput) {
      Alert.alert('Error', 'PINs do not match. Please verify.');
      return;
    }

    await updateSettings({
      ...settings,
      isAppLockEnabled: true,
      appLockPin: pinInput,
    });
    setPinModalVisible(false);
    Alert.alert('Security', 'App Lock PIN set successfully.');
  };

  const handleToggleBiometric = async (value) => {
    await updateSettings({
      ...settings,
      isBiometricEnabled: value,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Manage your account protection and access</Text>
          <View style={styles.encryptBox}>
            <Icon name="lock" size={32} color={COLORS.primary} />
            <Text style={styles.encryptTitle}>Your data is secured</Text>
            <Text style={styles.encryptText}>We use 256-bit AES encryption to ensure your financial ledgers remain private.</Text>
          </View>

          <SettingRow 
            label="App Lock Security Protection" 
            value={isAppLockEnabled} 
            onToggle={handleToggleAppLock} 
          />
          <SettingRow 
            label="Biometric Unlock (FaceID / Fingerprint)" 
            value={isBiometricEnabled} 
            onToggle={handleToggleBiometric} 
          />

          {isAppLockEnabled && (
            <>
              <Text style={styles.subheader}>ACCOUNT ACCESS</Text>
              <TouchableOpacity 
                style={styles.pinBtn}
                onPress={() => {
                  setPinInput('');
                  setConfirmPinInput('');
                  setPinModalVisible(true);
                }}
              >
                <Text style={styles.pinBtnText}>🔑  Change App Lock PIN</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.trusted}>Trusted by 2M+ merchants worldwide</Text>
        </View>

        {/* Create PIN Lock Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={pinModalVisible}
          onRequestClose={() => setPinModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set App Lock PIN</Text>
              
              <Text style={styles.modalLabel}>Enter new PIN</Text>
              <TextInput
                style={styles.modalInput}
                value={pinInput}
                onChangeText={setPinInput}
                placeholder="4-digit PIN code"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />

              <Text style={styles.modalLabel}>Confirm new PIN</Text>
              <TextInput
                style={styles.modalInput}
                value={confirmPinInput}
                onChangeText={setConfirmPinInput}
                placeholder="Confirm 4-digit PIN"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnCancel]} 
                  onPress={() => setPinModalVisible(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnSave]} 
                  onPress={handleSavePin}
                >
                  <Text style={styles.modalBtnSaveText}>Save PIN</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const SettingRow = ({ label, value, onToggle }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch 
      value={value} 
      onValueChange={onToggle} 
      trackColor={{ false: '#eee', true: COLORS.primary }} 
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, ...SHADOWS.sm },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  encryptBox: { backgroundColor: '#e2e8f0', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
  encryptTitle: { fontWeight: 'bold', color: COLORS.text, marginTop: 8 },
  encryptText: { fontSize: 11, textAlign: 'center', marginTop: 4, color: COLORS.textLight, lineHeight: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  subheader: { fontWeight: '700', marginTop: 16, marginBottom: 8, color: COLORS.textLight, fontSize: 11, letterSpacing: 0.5 },
  pinBtn: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  pinBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  trusted: { textAlign: 'center', marginTop: 24, fontSize: 11, color: COLORS.textMuted },
  
  // Modal layout
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    ...SHADOWS.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#FAFBFC',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  modalBtnCancelText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  modalBtnSave: {
    backgroundColor: COLORS.primary,
  },
  modalBtnSaveText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
