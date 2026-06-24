import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Icon from '@expo/vector-icons/MaterialIcons';

export default function AdminSettingsScreen() {
  const { logOut, isOnline, globalContent, updateGlobalContent } = useData();
  
  const [cmsForm, setCmsForm] = useState(globalContent || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (globalContent) {
      setCmsForm(globalContent);
    }
  }, [globalContent]);

  const handleSaveCMS = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot save CMS content while offline.');
      return;
    }
    setSaving(true);
    const res = await updateGlobalContent(cmsForm);
    setSaving(false);
    if (res.success) {
      Alert.alert('Success', 'Global content updated successfully. Live for all users.');
    } else {
      Alert.alert('Error', res.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Icon name="verified-user" size={48} color={COLORS.white} />
        </View>
        <Text style={styles.title}>Application Owner Panel</Text>
        <Text style={styles.subtitle}>Superuser configurations and logging settings</Text>
      </View>

      {/* Connection Console */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Connection Console</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Server Status:</Text>
          <View style={[styles.statusBadge, isOnline ? styles.onlineBadge : styles.offlineBadge]}>
            <View style={[styles.dot, isOnline ? styles.onlineDot : styles.offlineDot]} />
            <Text style={styles.statusText}>{isOnline ? 'Firebase Connected' : 'Firebase Offline'}</Text>
          </View>
        </View>

        <Text style={styles.label}>Active Database Services</Text>
        <Text style={{ fontSize: 13, color: COLORS.text, marginTop: 4 }}>• Cloud Firestore (Multi-tenant Ledger)</Text>
        <Text style={{ fontSize: 13, color: COLORS.text, marginTop: 4 }}>• Firebase Authentication</Text>
      </View>

      {/* Global CMS Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Management System (CMS)</Text>
        
        <Text style={styles.label}>Help & Support Contact Email</Text>
        <TextInput 
          style={styles.cmsInput} 
          value={cmsForm.helpEmail} 
          onChangeText={text => setCmsForm({...cmsForm, helpEmail: text})} 
        />

        <Text style={styles.label}>Help & Support Contact Phone</Text>
        <TextInput 
          style={styles.cmsInput} 
          value={cmsForm.helpPhone} 
          onChangeText={text => setCmsForm({...cmsForm, helpPhone: text})} 
        />

        <Text style={styles.label}>Help Intro Text</Text>
        <TextInput 
          style={[styles.cmsInput, { height: 80 }]} 
          multiline 
          textAlignVertical="top"
          value={cmsForm.helpIntro} 
          onChangeText={text => setCmsForm({...cmsForm, helpIntro: text})} 
        />

        <Text style={styles.label}>User Guide (Markdown supported)</Text>
        <TextInput 
          style={[styles.cmsInput, { height: 120 }]} 
          multiline 
          textAlignVertical="top"
          value={cmsForm.userGuide} 
          onChangeText={text => setCmsForm({...cmsForm, userGuide: text})} 
        />

        <Text style={styles.label}>Privacy Policy Text</Text>
        <TextInput 
          style={[styles.cmsInput, { height: 120 }]} 
          multiline 
          textAlignVertical="top"
          value={cmsForm.privacyText} 
          onChangeText={text => setCmsForm({...cmsForm, privacyText: text})} 
        />

        <Text style={styles.label}>Terms & Conditions Text</Text>
        <TextInput 
          style={[styles.cmsInput, { height: 120 }]} 
          multiline 
          textAlignVertical="top"
          value={cmsForm.termsText} 
          onChangeText={text => setCmsForm({...cmsForm, termsText: text})} 
        />

        <TouchableOpacity style={styles.saveCmsBtn} onPress={handleSaveCMS} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveCmsText}>Publish Changes Globally</Text>}
        </TouchableOpacity>
      </View>

      {/* Simulation options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maintenance & Admin Tools</Text>
        <TouchableOpacity style={styles.toolLink} onPress={() => Alert.alert('Backup Info', 'Database auto-backing up in the cloud.')}>
          <Icon name="cloud-upload" size={22} color={COLORS.primary} />
          <Text style={styles.toolLinkText}>Trigger Global Cloud Backup</Text>
          <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolLink} onPress={() => Alert.alert('Database Cleaned', 'Clearing temp transaction caches succeeded.')}>
          <Icon name="cleaning-services" size={22} color={COLORS.primary} />
          <Text style={styles.toolLinkText}>Clean System Cache Logs</Text>
          <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Log out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logOut}>
        <Icon name="logout" size={20} color="#dc3545" />
        <Text style={styles.logoutText}>Logout from Admin Console</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  scrollContent: {
    padding: SIZES.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.lg,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
    ...SHADOWS.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  statusLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineBadge: {
    backgroundColor: '#E6F4EA',
  },
  offlineBadge: {
    backgroundColor: '#FCE8E6',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: COLORS.success,
  },
  offlineDot: {
    backgroundColor: COLORS.danger,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#FAFBFC',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  toolLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  toolLinkText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.md,
    ...SHADOWS.sm,
  },
  logoutText: {
    color: '#dc3545',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  cmsInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: '#FAFBFC',
    marginBottom: SIZES.md,
  },
  saveCmsBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.sm,
  },
  saveCmsText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
