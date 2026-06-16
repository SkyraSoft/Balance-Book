import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';

export default function TermsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <Header />
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.para}>Welcome to Balance Book. These Terms of Service govern your access to and use of our financial management and ledger services...</Text>
          <Text style={styles.subtitle}>1. Introduction</Text>
          <Text style={styles.para}>Balance Book provides a digital platform for merchants to track financial transactions, debts, and credits.</Text>
          <Text style={styles.subtitle}>2. User Accounts</Text>
          <Text style={styles.para}>You are responsible for maintaining the confidentiality of your account credentials.</Text>
          <Text style={styles.subtitle}>3. Usage Guidelines</Text>
          <Text style={styles.para}>Prohibited activities include recording fraudulent debts or money laundering.</Text>
          <Text style={styles.subtitle}>4. Data Ownership</Text>
          <Text style={styles.para}>Your data belongs to you. We do not sell your personal financial records.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  card: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  para: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 8 },
});
