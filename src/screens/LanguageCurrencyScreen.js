import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Icon from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { CURRENCIES } from '../utils/currencies';
import Header from '../components/Header';

export default function LanguageCurrencyScreen({ navigation }) {
  const { language, currency, setLanguage, setCurrency, getTranslation } = useData();
  const [selectedLang, setSelectedLang] = useState(language);
  const [selectedCurr, setSelectedCurr] = useState(currency);
  const [currencySearch, setCurrencySearch] = useState('');
  const [showCurrDropdown, setShowCurrDropdown] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ur', label: 'اردو (Urdu)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'ar', label: 'العربية (Arabic)' },
    { code: 'es', label: 'Español (Spanish)' },
  ];

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
    c.label.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const handleSave = async () => {
    try {
      setLanguage(selectedLang);
      setCurrency(selectedCurr);

      await AsyncStorage.setItem('@balancebook_language', selectedLang);
      await AsyncStorage.setItem('@balancebook_currency', selectedCurr);

      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, 'users', uid), {
          language: selectedLang,
          currency: selectedCurr,
        });
      }

      Alert.alert('Success', 'Preferences updated successfully.');
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save language/currency settings:', err);
      Alert.alert('Error', 'Unable to save configuration preferences.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Language Preferences</Text>
          <Text style={styles.subtitle}>Select display language for ledger labels.</Text>
          
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.optionRow, selectedLang === lang.code && styles.optionRowActive]}
              onPress={() => setSelectedLang(lang.code)}
            >
              <Text style={[styles.optionText, selectedLang === lang.code && styles.optionTextActive]}>
                {lang.label}
              </Text>
              {selectedLang === lang.code && (
                <Icon name="check-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Base Currency</Text>
          <Text style={styles.subtitle}>Choose your default billing currency symbol.</Text>

          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowCurrDropdown(!showCurrDropdown)}
          >
            <Text style={styles.dropdownValue}>
              {CURRENCIES.find(c => c.code === selectedCurr)?.label || selectedCurr}
            </Text>
            <Icon name={showCurrDropdown ? "arrow-drop-up" : "arrow-drop-down"} size={24} color={COLORS.textLight} />
          </TouchableOpacity>

          {showCurrDropdown && (
            <View style={styles.dropdownMenu}>
              <View style={styles.searchContainer}>
                <Icon name="search" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search currencies..."
                  value={currencySearch}
                  onChangeText={setCurrencySearch}
                />
              </View>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {filteredCurrencies.map((curr) => (
                  <TouchableOpacity
                    key={curr.code}
                    style={[styles.dropdownItem, selectedCurr === curr.code && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedCurr(curr.code);
                      setShowCurrDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, selectedCurr === curr.code && styles.dropdownItemTextActive]}>
                      {curr.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                {filteredCurrencies.length === 0 && (
                  <Text style={styles.noResults}>No currencies found</Text>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Apply Preferences</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 12, color: COLORS.textLight, marginBottom: 16 },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionRowActive: {
    borderBottomColor: COLORS.primaryLight,
  },
  optionText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  optionTextActive: { color: COLORS.primary, fontWeight: '700' },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FAFBFC',
  },
  dropdownValue: { fontSize: 14, color: COLORS.text },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    marginTop: 4,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: COLORS.text },
  noResults: { padding: 16, textAlign: 'center', color: COLORS.textMuted, fontSize: 12 },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: { backgroundColor: COLORS.primaryLight },
  dropdownItemText: { fontSize: 14, color: COLORS.text },
  dropdownItemTextActive: { color: COLORS.primary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.sm,
    marginTop: 10,
  },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
