import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useData } from '../context/DataContext';
import { COLORS, SIZES } from '../utils/theme';

export default function Header() {
  const navigation = useNavigation();
  const { settings, notifications, activeWorkspace, userWorkspaces, setActiveWorkspace } = useData();
  const [showWorkspaceModal, setShowWorkspaceModal] = React.useState(false);

  const currentWorkspaceName = activeWorkspace === 'personal' 
    ? settings.businessName || 'Personal Ledger'
    : activeWorkspace.name;

  const storeInitials = currentWorkspaceName 
    ? currentWorkspaceName.split(' ').slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase()
    : 'BB';

  const pendingCount = notifications.filter(n => n.status === 'pending' && !n.isRead).length;
  
  // Safety check to verify if back navigation is active
  let canGoBack = false;
  try {
    canGoBack = navigation.canGoBack();
  } catch (e) {
    // Fail-safe if navigation context isn't fully loaded
  }

  const handleSelectWorkspace = (ws) => {
    setActiveWorkspace(ws);
    setShowWorkspaceModal(false);
  };

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
          onPress={() => {
            if (userWorkspaces.length > 0) {
              setShowWorkspaceModal(true);
            } else {
              navigation.navigate('SettingsTab', { screen: 'BusinessProfile' });
            }
          }}
        >
          <View style={styles.avatarPic}>
            <Text style={styles.avatarPicText}>{storeInitials}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.profileName} numberOfLines={1}>{currentWorkspaceName}</Text>
            {userWorkspaces.length > 0 && (
              <Icon name="arrow-drop-down" size={20} color={COLORS.primary} />
            )}
          </View>
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

      {/* Workspace Switcher Modal */}
      {showWorkspaceModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Ledger</Text>
            
            <TouchableOpacity 
              style={[styles.wsOption, activeWorkspace === 'personal' && styles.wsOptionActive]}
              onPress={() => handleSelectWorkspace('personal')}
            >
              <Text style={[styles.wsOptionText, activeWorkspace === 'personal' && styles.wsOptionTextActive]}>
                {settings.businessName || 'Personal Ledger'}
              </Text>
            </TouchableOpacity>

            {userWorkspaces.map(ws => (
              <TouchableOpacity 
                key={ws.id}
                style={[styles.wsOption, activeWorkspace?.id === ws.id && styles.wsOptionActive]}
                onPress={() => handleSelectWorkspace(ws)}
              >
                <Text style={[styles.wsOptionText, activeWorkspace?.id === ws.id && styles.wsOptionTextActive]}>
                  {ws.name}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={styles.closeModalBtn}
              onPress={() => setShowWorkspaceModal(false)}
            >
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    backgroundColor: COLORS.error,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: -1000, // Cover screen
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.lg,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  wsOption: {
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  wsOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.base,
    paddingHorizontal: SIZES.sm,
  },
  wsOptionText: {
    fontSize: SIZES.body3,
    color: COLORS.text,
  },
  wsOptionTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  closeModalBtn: {
    marginTop: SIZES.lg,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: COLORS.error,
    fontWeight: 'bold',
  }
});
