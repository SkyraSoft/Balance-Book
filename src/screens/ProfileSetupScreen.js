import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image, TextInput } from 'react-native';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Icon from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { CURRENCIES } from '../utils/currencies';
import { Country, State } from 'country-state-city';

export default function ProfileSetupScreen() {
  const { settings, completeOnboarding, getTranslation } = useData();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedCurr, setSelectedCurr] = useState('USD');
  const [profileImage, setProfileImage] = useState('');

  // Survey states
  const [country, setCountry] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [businessType, setBusinessType] = useState('Retail');
  const [position, setPosition] = useState('Owner');
  const [referralSource, setReferralSource] = useState('Play Store');
  const [purpose, setPurpose] = useState('Track credit');

  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showCurrMenu, setShowCurrMenu] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [showStateMenu, setShowStateMenu] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');

  // Country and State data
  const allCountries = Country.getAllCountries();
  const availableStates = country ? State.getStatesOfCountry(country) : [];

  const filteredCountries = allCountries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
  const filteredStates = availableStates.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()));

  // Prefill details from settings when they load
  useEffect(() => {
    if (settings) {
      if (settings.businessName && settings.businessName !== 'Balance Book Merchant' && settings.businessName !== 'KhathaLedger Merchant') {
        setName(settings.businessName);
      }
      if (settings.businessPhone) {
        setPhone(settings.businessPhone);
      }
      if (settings.businessAddress) {
        setAddress(settings.businessAddress);
      }
      if (settings.profileImage) {
        setProfileImage(settings.profileImage);
      }
    }
  }, [settings]);



  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ur', label: 'اردو (Urdu)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'ar', label: 'العربية (Arabic)' },
    { code: 'es', label: 'Español (Spanish)' },
  ];

  const businessTypes = ['Freelancer', 'Individual / Personal', 'Retail', 'Wholesale', 'Services', 'Corporate', 'Food/Restaurant', 'Clothing', 'Electronics', 'Other'];
  const positions = ['Owner', 'Partner', 'Manager', 'Accountant', 'Employee'];
  const referralSources = ['Social Media', 'Friend/Referral', 'Play Store', 'Online Search', 'Ad', 'Other'];
  const purposes = ['Track credit', 'Sync with peers', 'Export invoices', 'Monthly reporting', 'All of the above'];

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
    c.label.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const pickImage = async () => {
    await launchGallery();
  };

  const launchGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required to choose photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setProfileImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleComplete = async () => {
    if (!name.trim() || !phone.trim() || !address.trim() || !country.trim() || !stateProvince.trim()) {
      Alert.alert('Error', 'Please fill in all store and location fields.');
      return;
    }
    
    await completeOnboarding({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      language: selectedLang,
      currency: selectedCurr,
      profileImage: profileImage,
      country: Country.getCountryByCode(country)?.name || country.trim(),
      city: stateProvince.trim(),
      businessType,
      position,
      referralSource,
      purpose
    });
  };

  const storeInitials = name 
    ? name.split(' ').slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase()
    : 'BB';

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Set up store information and quick feedback survey.</Text>
        </View>

        <View style={styles.card}>
          {/* Avatar Selector */}
          <Text style={styles.label}>Profile Image</Text>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarTouch}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{storeInitials}</Text>
                  <Icon name="photo-camera" size={20} color={COLORS.white} style={styles.cameraIcon} />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.avatarHelp}>Tap to select from Gallery</Text>
          </View>

          <Input 
            label="Business / Store Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Al-Makkah General Store"
          />

          <Input 
            label="Contact Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. +92 300 1234567"
            keyboardType="phone-pad"
          />

          <Input 
            label="Store Address"
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. Model Town, Lahore"
            multiline
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Country</Text>
              <TouchableOpacity 
                style={styles.dropdown} 
                onPress={() => {
                  setShowCountryMenu(!showCountryMenu);
                  setShowStateMenu(false);
                  setShowLangMenu(false);
                  setShowCurrMenu(false);
                }}
              >
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {country ? Country.getCountryByCode(country)?.name : 'Select Country'}
                </Text>
                <Icon name={showCountryMenu ? "arrow-drop-up" : "arrow-drop-down"} size={24} color={COLORS.textLight} />
              </TouchableOpacity>
              {showCountryMenu && (
                <View style={styles.dropdownMenu}>
                  <View style={styles.searchBoxContainer}>
                    <Icon name="search" size={20} color={COLORS.textLight} />
                    <TextInput
                      style={styles.searchBox}
                      placeholder="Search country..."
                      value={countrySearch}
                      onChangeText={setCountrySearch}
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {filteredCountries.map((c) => (
                      <TouchableOpacity 
                        key={c.isoCode} 
                        style={[styles.dropdownItem, country === c.isoCode && styles.dropdownItemActive]}
                        onPress={() => {
                          setCountry(c.isoCode);
                          setStateProvince('');
                          setShowCountryMenu(false);
                          setCountrySearch('');
                        }}
                      >
                        <Text style={[styles.dropdownItemText, country === c.isoCode && styles.dropdownItemTextActive]}>
                          {c.flag} {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>State / Province</Text>
              <TouchableOpacity 
                style={[styles.dropdown, !country && { opacity: 0.5 }]} 
                disabled={!country}
                onPress={() => {
                  setShowStateMenu(!showStateMenu);
                  setShowCountryMenu(false);
                  setShowLangMenu(false);
                  setShowCurrMenu(false);
                }}
              >
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {stateProvince || 'Select State'}
                </Text>
                <Icon name={showStateMenu ? "arrow-drop-up" : "arrow-drop-down"} size={24} color={COLORS.textLight} />
              </TouchableOpacity>
              {showStateMenu && country && (
                <View style={styles.dropdownMenu}>
                  <View style={styles.searchBoxContainer}>
                    <Icon name="search" size={20} color={COLORS.textLight} />
                    <TextInput
                      style={styles.searchBox}
                      placeholder="Search state..."
                      value={stateSearch}
                      onChangeText={setStateSearch}
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {filteredStates.map((s) => (
                      <TouchableOpacity 
                        key={s.isoCode} 
                        style={[styles.dropdownItem, stateProvince === s.name && styles.dropdownItemActive]}
                        onPress={() => {
                          setStateProvince(s.name);
                          setShowStateMenu(false);
                          setStateSearch('');
                        }}
                      >
                        <Text style={[styles.dropdownItemText, stateProvince === s.name && styles.dropdownItemTextActive]}>
                          {s.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {filteredStates.length === 0 && (
                      <TouchableOpacity 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setStateProvince('Other');
                          setShowStateMenu(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>Other / N/A</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Survey Fields */}
          <Text style={styles.surveyTitle}>Merchant Feedback Survey</Text>

          <Text style={styles.label}>Business Type</Text>
          <View style={styles.selectorRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollSelect}>
              {businessTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.selectorBtn, businessType === type && styles.selectorBtnActive]}
                  onPress={() => setBusinessType(type)}
                >
                  <Text style={[styles.selectorBtnText, businessType === type && styles.selectorBtnTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={styles.label}>Your Position</Text>
          <View style={styles.selectorRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollSelect}>
              {positions.map(pos => (
                <TouchableOpacity
                  key={pos}
                  style={[styles.selectorBtn, position === pos && styles.selectorBtnActive]}
                  onPress={() => setPosition(pos)}
                >
                  <Text style={[styles.selectorBtnText, position === pos && styles.selectorBtnTextActive]}>{pos}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={styles.label}>Where did you learn about us?</Text>
          <View style={styles.selectorRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollSelect}>
              {referralSources.map(src => (
                <TouchableOpacity
                  key={src}
                  style={[styles.selectorBtn, referralSource === src && styles.selectorBtnActive]}
                  onPress={() => setReferralSource(src)}
                >
                  <Text style={[styles.selectorBtnText, referralSource === src && styles.selectorBtnTextActive]}>{src}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={styles.label}>Purpose of using this app</Text>
          <View style={styles.selectorRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollSelect}>
              {purposes.map(purp => (
                <TouchableOpacity
                  key={purp}
                  style={[styles.selectorBtn, purpose === purp && styles.selectorBtnActive]}
                  onPress={() => setPurpose(purp)}
                >
                  <Text style={[styles.selectorBtnText, purpose === purp && styles.selectorBtnTextActive]}>{purp}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.divider} />

          {/* Language Selector */}
          <Text style={styles.label}>{getTranslation('langSelect')}</Text>
          <TouchableOpacity 
            style={styles.dropdown} 
            onPress={() => {
              setShowLangMenu(!showLangMenu);
              setShowCurrMenu(false);
            }}
          >
            <Text style={styles.dropdownText}>
              {languages.find(l => l.code === selectedLang)?.label}
            </Text>
            <Icon name={showLangMenu ? "arrow-drop-up" : "arrow-drop-down"} size={24} color={COLORS.textLight} />
          </TouchableOpacity>

          {showLangMenu && (
            <View style={styles.dropdownMenu}>
              {languages.map((lang) => (
                <TouchableOpacity 
                  key={lang.code} 
                  style={[styles.dropdownItem, selectedLang === lang.code && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedLang(lang.code);
                    setShowLangMenu(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedLang === lang.code && styles.dropdownItemTextActive]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Currency Selector with Search */}
          <Text style={[styles.label, { marginTop: SIZES.md }]}>{getTranslation('currencySelect')}</Text>
          <TouchableOpacity 
            style={styles.dropdown} 
            onPress={() => {
              setShowCurrMenu(!showCurrMenu);
              setShowLangMenu(false);
              setCurrencySearch('');
            }}
          >
            <Text style={styles.dropdownText}>
              {CURRENCIES.find(c => c.code === selectedCurr)?.label || selectedCurr}
            </Text>
            <Icon name={showCurrMenu ? "arrow-drop-up" : "arrow-drop-down"} size={24} color={COLORS.textLight} />
          </TouchableOpacity>

          {showCurrMenu && (
            <View style={styles.dropdownMenuLarge}>
              <View style={styles.searchBoxContainer}>
                <Icon name="search" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchBox}
                  placeholder="Search currency..."
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
                      setShowCurrMenu(false);
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

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button title={getTranslation('completeSetup')} onPress={handleComplete} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  scrollContent: {
    padding: SIZES.lg,
    paddingBottom: 80,
  },
  header: {
    marginTop: 20,
    marginBottom: SIZES.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  avatarTouch: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    ...SHADOWS.md,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarInitials: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 2,
  },
  avatarHelp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: SIZES.lg,
  },
  surveyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  selectorRow: {
    marginBottom: SIZES.md,
  },
  scrollSelect: {
    gap: 8,
    paddingVertical: 2,
  },
  selectorBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FAFBFC',
  },
  selectorBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  selectorBtnText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  selectorBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
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
  dropdownMenuLarge: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    marginTop: 4,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
  },
  searchBox: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  noResults: {
    padding: 16,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
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
  footer: {
    padding: SIZES.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
