import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>1. Information We Collect</Text>
        <Text style={styles.para}>We collect account details, transaction records, and device information to provide our service.</Text>
        <Text style={styles.subtitle}>2. How We Use Data</Text>
        <Text style={styles.para}>Your data is used for bookkeeping, reminders, and insights. We do not sell your data.</Text>
        <Text style={styles.subtitle}>3. Data Security</Text>
        <Text style={styles.para}>We implement industry-standard security measures including 256-bit AES encryption.</Text>
        <Text style={styles.subtitle}>4. Third-Party Sharing</Text>
        <Text style={styles.para}>We only share with trusted partners like SMS gateways under strict confidentiality.</Text>
        <Text style={styles.subtitle}>5. Your Rights</Text>
        <Text style={styles.para}>You can access, export, or delete your data at any time.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  para: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 8 },
});
