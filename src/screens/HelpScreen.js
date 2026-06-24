import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import { useData } from '../context/DataContext';
import Header from '../components/Header';

export default function HelpScreen({ navigation }) {
  const { submitSupportTicket, globalContent } = useData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Payment');
  const [message, setMessage] = useState('');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = ['Payment', 'Backup', 'Login/App Lock', 'Reports', 'Other'];

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message before submitting.');
      return;
    }

    setLoading(true);
    try {
      const success = await submitSupportTicket(category, message);
      if (success) {
        Alert.alert('Success', 'Your message has been sent to our support team. We will get back to you shortly.');
        setMessage('');
      } else {
        Alert.alert('Error', 'Failed to submit ticket. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Title Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>How can we help?</Text>
          <Text style={styles.headerSubtitle}>Find answers in our guides or contact our support team directly.</Text>
        </View>
  
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for articles, guides, FAQs..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Dynamic Global CMS Intro & Contact */}
        <View style={styles.contactInfoBox}>
          <Text style={styles.contactIntroText}>{globalContent?.helpIntro || 'Having issues with your ledger? Contact our global support team available 24/7.'}</Text>
          <View style={styles.contactRow}>
            <Icon name="email" size={18} color={COLORS.primary} />
            <Text style={styles.contactText}>{globalContent?.helpEmail || 'support@balancebook.app'}</Text>
          </View>
          <View style={styles.contactRow}>
            <Icon name="phone" size={18} color={COLORS.primary} />
            <Text style={styles.contactText}>{globalContent?.helpPhone || '+1-800-BALANCE'}</Text>
          </View>
        </View>
  
        {/* FAQ Grid Quick Categories */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqGrid}>
            <TouchableOpacity 
              style={styles.faqCard}
              onPress={() => Alert.alert('Quick Support', `For quick support, call our customer care hotline at ${globalContent?.helpPhone} or submit a message in the contact form below.`)}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Icon name="support-agent" size={24} color="#0284C7" />
              </View>
              <Text style={styles.faqCardText}>Quick Support</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.faqCard}
              onPress={() => navigation.navigate('UserGuide')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="menu-book" size={24} color="#D97706" />
              </View>
              <Text style={styles.faqCardText}>User Guide</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.faqCard}
              onPress={() => Alert.alert('Backup FAQ', 'Automatic cloud synchronization is enabled by default. If offline, transactions are stored in cache and will automatically upload once a connection is established.')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="cloud-done" size={24} color="#16A34A" />
              </View>
              <Text style={styles.faqCardText}>Backup FAQ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.faqCard}
              onPress={() => Alert.alert('Payment Issues', 'If an entry shows incorrect balance totals, verify whether the transaction type is set to gave (reduces ledger due) or got (increases collection cash).')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="account-balance-wallet" size={24} color="#DC2626" />
              </View>
              <Text style={styles.faqCardText}>Payment Issues</Text>
            </TouchableOpacity>
          </View>
        </View>

      {/* Contact Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Send us a Message</Text>

        <Text style={styles.label}>Choose Category</Text>
        <TouchableOpacity 
          style={styles.dropdown} 
          onPress={() => setShowCategoryMenu(!showCategoryMenu)}
        >
          <Text style={styles.dropdownText}>{category}</Text>
          <Icon name={showCategoryMenu ? "arrow-drop-up" : "arrow-drop-down"} size={24} color={COLORS.textLight} />
        </TouchableOpacity>

        {showCategoryMenu && (
          <View style={styles.dropdownMenu}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.dropdownItem, category === cat && styles.dropdownItemActive]}
                onPress={() => {
                  setCategory(cat);
                  setShowCategoryMenu(false);
                }}
              >
                <Text style={[styles.dropdownItemText, category === cat && styles.dropdownItemTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.label, { marginTop: SIZES.md }]}>Write your Message</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your issue or query in detail here..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>Submit Message</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
    padding: SIZES.lg,
  },
  header: {
    marginTop: 10,
    marginBottom: SIZES.lg,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 6,
    lineHeight: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.md,
    height: 50,
    ...SHADOWS.sm,
    marginBottom: SIZES.xl,
  },
  searchInput: {
    flex: 1,
    marginLeft: SIZES.sm,
    fontSize: 14,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  faqSection: {
    marginBottom: SIZES.xl,
  },
  faqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  faqCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    alignItems: 'center',
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  faqCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  contactInfoBox: {
    backgroundColor: '#EEF2FF',
    padding: SIZES.lg,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.xl,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  contactIntroText: {
    fontSize: 13,
    color: '#3730A3',
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#312E81',
    marginLeft: 8,
  },
  formSection: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    ...SHADOWS.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    height: 48,
    backgroundColor: '#FAFBFC',
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.text,
  },
  dropdownMenu: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    marginTop: 4,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.text,
  },
  dropdownItemTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    height: 120,
    backgroundColor: '#FAFBFC',
    fontSize: 14,
    color: COLORS.text,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusXl,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.lg,
    ...SHADOWS.sm,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
