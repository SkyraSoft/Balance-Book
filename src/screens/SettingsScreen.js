import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Header from '../components/Header';

export default function SettingsScreen({ navigation }) {
  const { settings, isOnline, logOut, deleteAccountPermanently } = useData();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out of Balance Book?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => await logOut() }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'DELETE ACCOUNT',
      'WARNING: This will permanently delete your merchant account and wipe out all transaction entries. This action cannot be undone. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Permanently', 
          style: 'destructive', 
          onPress: async () => {
            const res = await deleteAccountPermanently();
            if (res.success) {
              Alert.alert('Deleted', 'Your account has been deleted successfully.');
            } else {
              Alert.alert('Error', res.message || 'Failed to delete account.');
            }
          } 
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.brandLogo}>
            <Icon name="menu-book" size={36} color={COLORS.white} />
          </View>
          <Text style={styles.brandTitle}>Balance Book</Text>
          <Text style={styles.brandSubtitle}>Manage credit ledger accounts cleanly</Text>
          
          {/* Server status indicator */}
          <View style={[styles.statusBadge, isOnline ? styles.badgeOnline : styles.badgeOffline]}>
            <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.statusText}>{isOnline ? 'Synced to Server' : 'Offline Mode'}</Text>
          </View>
        </View>

        {/* Main Settings Menu launcher */}
        <View style={styles.menuSection}>
          <MenuItem 
            icon="business" 
            title="Business Profile" 
            desc="Edit store name, phone, address, and profile photo"
            onPress={() => navigation.navigate('BusinessProfile')} 
          />
          <MenuItem 
            icon="link" 
            title="Pair Peer Ledger" 
            desc="Connect with other merchants to auto-validate accounts"
            onPress={() => navigation.navigate('PeerConnection')} 
          />
          <MenuItem 
            icon="help-outline" 
            title="Help & Support" 
            desc="Read FAQs, contact help desk"
            onPress={() => navigation.navigate('HelpSupport')} 
          />
          <MenuItem 
            icon="book" 
            title="User Guide" 
            desc="Detailed manual for app features"
            onPress={() => navigation.navigate('UserGuide')} 
          />
          <MenuItem 
            icon="backup" 
            title="Backup & Restore" 
            desc="Automatic daily cloud syncs"
            onPress={() => navigation.navigate('BackupRestore')} 
          />
          <MenuItem 
            icon="file-download" 
            title="Export Data" 
            desc="Download statements in PDF/Excel"
            onPress={() => navigation.navigate('ExportData')} 
          />
          <MenuItem 
            icon="notifications-none" 
            title="Notifications" 
            desc="Payment alerts, reminders schedules"
            onPress={() => navigation.navigate('NotificationsSettings')} 
          />
          <MenuItem 
            icon="security" 
            title="Security & App Lock" 
            desc="Protect database with PIN pattern"
            onPress={() => navigation.navigate('SecuritySettings')} 
          />
          <MenuItem 
            icon="translate" 
            title="Language & Currency" 
            desc="Configure local units and text"
            onPress={() => navigation.navigate('LanguageCurrency')} 
          />
          <MenuItem 
            icon="description" 
            title="Terms & Conditions" 
            desc="Read standard licensing terms"
            onPress={() => navigation.navigate('Terms')} 
          />
          <MenuItem 
            icon="lock-outline" 
            title="Privacy Policy" 
            desc="Data collection and usage policy"
            onPress={() => navigation.navigate('Privacy')} 
          />
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <Icon name="logout" size={20} color="#dc3545" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
        >
          <Icon name="delete-forever" size={20} color="#dc3545" />
          <Text style={styles.deleteText}>Delete Account Permanently</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 3.0.0 (Gold edition)</Text>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const MenuItem = ({ icon, title, desc, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIconContainer}>
      <Icon name={icon} size={22} color={COLORS.primary} />
    </View>
    <View style={styles.menuTextContainer}>
      <Text style={styles.menuText}>{title}</Text>
      {desc && <Text style={styles.menuSubText}>{desc}</Text>}
    </View>
    <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FAFBFC' 
  },
  brandHeader: {
    alignItems: 'center',
    paddingVertical: 35,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    marginBottom: SIZES.md,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  badgeOnline: {
    backgroundColor: '#E6F4EA',
  },
  badgeOffline: {
    backgroundColor: '#FCE8E6',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: COLORS.success,
  },
  dotOffline: {
    backgroundColor: COLORS.danger,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuSection: { 
    backgroundColor: COLORS.white, 
    marginHorizontal: SIZES.md, 
    borderRadius: SIZES.radiusLg, 
    overflow: 'hidden', 
    marginTop: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SIZES.md, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: { 
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuSubText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  logoutBtn: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.white, 
    marginHorizontal: SIZES.md, 
    padding: SIZES.md, 
    borderRadius: SIZES.radiusLg, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  logoutText: { 
    color: '#dc3545', 
    fontSize: 14, 
    fontWeight: '700', 
    marginLeft: 8 
  },
  deleteBtn: {
    flexDirection: 'row', 
    backgroundColor: '#FFF5F5', 
    marginHorizontal: SIZES.md, 
    padding: SIZES.md, 
    borderRadius: SIZES.radiusLg, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: SIZES.sm,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    ...SHADOWS.sm,
  },
  deleteText: {
    color: '#dc3545', 
    fontSize: 14, 
    fontWeight: '700', 
    marginLeft: 8 
  },
  version: { 
    textAlign: 'center', 
    color: COLORS.textMuted, 
    fontSize: 11,
    marginTop: SIZES.xl,
    marginBottom: SIZES.md,
  },
  
  // Modal layout
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    width: '90%',
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
    height: 48,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#FAFBFC',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
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
