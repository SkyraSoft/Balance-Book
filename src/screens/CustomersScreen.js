import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Header from '../components/Header';

export default function CustomersScreen({ navigation }) {
  const { customers, getTranslation, getCurrencySymbol, activeWorkspace, token } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All'); // 'All', 'Give', 'Get'

  let canAddCustomer = true;
  if (activeWorkspace !== 'personal') {
    const role = activeWorkspace.roles?.[token] || 'viewer';
    if (role === 'viewer') canAddCustomer = false;
  }

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search));
    
    let matchesFilter = true;
    if (filter === 'Give') matchesFilter = c.balance < 0;
    if (filter === 'Get') matchesFilter = c.balance > 0;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={24} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={getTranslation('searchCustomers')}
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'All' && styles.filterBtnActive]}
            onPress={() => setFilter('All')}
          >
            <Text style={[styles.filterText, filter === 'All' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'Get' && styles.filterBtnActive]}
            onPress={() => setFilter('Get')}
          >
            <Text style={[styles.filterText, filter === 'Get' && styles.filterTextActive]}>{getTranslation('youllGet')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'Give' && styles.filterBtnActive]}
            onPress={() => setFilter('Give')}
          >
            <Text style={[styles.filterText, filter === 'Give' && styles.filterTextActive]}>{getTranslation('youllGive')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={item => item.id || item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.customerItem}
            onPress={() => navigation.navigate('CustomersTab', { screen: 'CustomerDetail', params: { customerId: item.id || item._id }})}
          >
            <View style={styles.itemLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.customerSub}>{item.phone || 'No phone'}</Text>
              </View>
            </View>
            <View style={styles.itemRight}>
              <Text style={[
                styles.balanceText, 
                item.balance > 0 ? styles.colorSuccess : item.balance < 0 ? styles.colorDanger : styles.colorMuted
              ]}>
                {getCurrencySymbol()}{Math.abs(item.balance).toLocaleString()}
              </Text>
              <Text style={styles.balanceLabel}>
                {item.balance > 0 ? getTranslation('youllGet') : item.balance < 0 ? getTranslation('youllGive') : getTranslation('settled')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {canAddCustomer && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate('CustomersTab', { screen: 'AddCustomer' })}
        >
          <Icon name="person-add" size={24} color={COLORS.white} />
          <Text style={styles.fabText}>{getTranslation('addCustomer')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.surface 
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.md,
    height: 48,
    marginBottom: SIZES.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: SIZES.sm,
    fontSize: SIZES.fontMd,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.surface,
    marginHorizontal: 4,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primaryLight,
  },
  filterText: {
    color: COLORS.textLight,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: SIZES.md,
    paddingBottom: 80, // For FAB
  },
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  customerSub: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  balanceText: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
  },
  balanceLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },
  colorSuccess: { color: COLORS.success },
  colorDanger: { color: COLORS.danger },
  colorMuted: { color: COLORS.textMuted },
  fab: {
    position: 'absolute',
    bottom: SIZES.lg,
    right: SIZES.lg,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: 30,
    ...SHADOWS.md,
  },
  fabText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: SIZES.sm,
    fontSize: SIZES.fontMd,
  }
});
