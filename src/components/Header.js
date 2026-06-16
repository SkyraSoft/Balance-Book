import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import { COLORS, SIZES } from '../utils/theme';

export default function Header() {
  const navigation = useNavigation();
  const { settings, notifications } = useData();

  const storeInitials = settings.businessName 
    ? settings.businessName.split(' ').slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase()
    : 'BB';

  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  
  // Safety check to verify if back navigation is active
  let canGoBack = false;
  try {
    canGoBack = navigation.canGoBack();
  } catch (e) {
    // Fail-safe if navigation context isn't fully loaded
  }

  return (
    <View style={styles.topHeader}>
      <View style={styles.leftSection}>
        {canGoBack && (
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.profileArea}
          onPress={() => navigation.navigate('SettingsTab', { screen: 'BusinessProfile' })}
        >
          {settings.profileImage ? (
            <Image source={{ uri: settings.profileImage }} style={styles.avatarPic} />
          ) : (
            <View style={styles.avatarPic}>
              <Text style={styles.avatarPicText}>{storeInitials}</Text>
            </View>
          )}
          <Text style={styles.profileName} numberOfLines={1}>{settings.businessName}</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.bellBtn}
        onPress={() => navigation.navigate('SettingsTab', { screen: 'NotificationsList' })}
      >
        <Icon name="notifications-none" size={26} color={COLORS.primary} />
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
    paddingBottom: SIZES.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    paddingRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  avatarPicText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F766E',
    maxWidth: 160,
  },
  bellBtn: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
});
