import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';
import { useData } from '../context/DataContext';

export default function PrivacyScreen() {
  const { globalContent } = useData();
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <Header />
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.para}>
            {globalContent?.privacyText || 'Loading privacy policy...'}
          </Text>
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
