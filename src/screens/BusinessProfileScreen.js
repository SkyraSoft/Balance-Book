import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useData } from '../context/DataContext';

export default function BusinessProfileScreen({ navigation }) {
  const { settings, updateSettings } = useData();
  const [name, setName] = useState(settings.businessName);
  const [phone, setPhone] = useState(settings.businessPhone);
  const [address, setAddress] = useState(settings.businessAddress);

  const handleSave = async () => {
    await updateSettings({ ...settings, businessName: name, businessPhone: phone, businessAddress: address });
    Alert.alert('Saved', 'Profile updated');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Business Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Text style={styles.label}>Address</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} multiline />
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 16 },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ddd', marginBottom: 8 },
  saveBtn: { backgroundColor: '#2c7da0', padding: 14, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});
