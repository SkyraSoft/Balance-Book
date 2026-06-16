import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';
import Header from '../components/Header';

export default function BusinessProfileScreen({ navigation }) {
  const { settings, updateSettings } = useData();
  const [name, setName] = useState(settings.businessName || '');
  const [phone, setPhone] = useState(settings.businessPhone || '');
  const [address, setAddress] = useState(settings.businessAddress || '');
  const [profileImage, setProfileImage] = useState(settings.profileImage || '');

  const pickImage = async () => {
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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Business Name is required.');
      return;
    }
    await updateSettings({ 
      ...settings, 
      businessName: name, 
      businessPhone: phone, 
      businessAddress: address,
      profileImage: profileImage 
    });
    Alert.alert('Success', 'Business Profile updated successfully!');
    navigation.goBack();
  };

  const storeInitials = name 
    ? name.split(' ').slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase()
    : 'BB';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Profile Image View */}
          <TouchableOpacity onPress={pickImage} style={styles.avatarSection}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarPreview} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{storeInitials}</Text>
              </View>
            )}
            <Text style={styles.avatarLabel}>Tap to select from Gallery</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Form Fields */}
          <Text style={styles.label}>Business Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          
          <Text style={styles.label}>Phone Contact</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          
          <Text style={styles.label}>Address Location</Text>
          <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} multiline numberOfLines={3} />
          
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Save Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16, ...SHADOWS.sm },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatarLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 8,
  },
  subheader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  avatarThumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarThumbnail: {
    width: '100%',
    height: '100%',
  },
  selectedThumbnail: {
    borderColor: COLORS.primary,
  },
  avatarResetBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 8,
    color: COLORS.textLight,
    fontWeight: '700',
    marginTop: 2,
  },
  label: { fontWeight: '700', marginTop: 12, marginBottom: 6, fontSize: 11, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#FAFBFC', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ddd', marginBottom: 8, fontSize: 14, color: COLORS.text },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  saveBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, marginTop: 20, alignItems: 'center', ...SHADOWS.sm },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
