import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Share, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { db, auth } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import { COLORS, SIZES } from '../utils/theme';

export default function BusinessManagementScreen() {
  const navigation = useNavigation();
  const { activeWorkspace, setActiveWorkspace, userWorkspaces, getTranslation } = useData();
  
  const [newBizName, setNewBizName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('partner');
  const [loading, setLoading] = useState(false);

  const isPersonal = activeWorkspace === 'personal';
  const isAdmin = activeWorkspace !== 'personal' && activeWorkspace.roles && activeWorkspace.roles[auth.currentUser?.uid] === 'admin';

  const handleCreateBusiness = async () => {
    if (!newBizName.trim()) return Alert.alert('Error', 'Business name is required');
    setLoading(true);
    try {
      const uid = auth.currentUser.uid;
      const docRef = await addDoc(collection(db, 'businesses'), {
        name: newBizName,
        adminId: uid,
        memberIds: [uid],
        roles: {
          [uid]: 'admin'
        },
        createdAt: new Date().toISOString()
      });
      setNewBizName('');
      Alert.alert('Success', 'Business created! You can switch to it from the header dropdown.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return Alert.alert('Error', 'Email is required');
    setLoading(true);
    try {
      // Find user
      const q = query(collection(db, 'users'), where('email', '==', inviteEmail.toLowerCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setLoading(false);
        Alert.alert(
          'User Not Found', 
          'This email is not registered on Balance Book yet. Would you like to invite them to download the app?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Invite via WhatsApp/Share', 
              onPress: async () => {
                const inviteMessage = `Join me on Balance Book! Download the app and register with ${inviteEmail} so I can add you to our shared business ledger "${activeWorkspace.name}".`;
                try {
                  await Share.share({
                    message: inviteMessage,
                    title: 'Join Balance Book'
                  });
                } catch (e) {
                  console.log(e);
                }
              }
            }
          ]
        );
        return;
      }
      const targetUid = snap.docs[0].id;
      
      if (activeWorkspace.memberIds?.includes(targetUid)) {
        Alert.alert('Error', 'User is already a member');
        setLoading(false);
        return;
      }

      // Add user directly
      const bizRef = doc(db, 'businesses', activeWorkspace.id);
      await updateDoc(bizRef, {
        memberIds: arrayUnion(targetUid),
        [`roles.${targetUid}`]: inviteRole
      });

      // Send notification
      await addDoc(collection(db, 'notifications'), {
        recipientId: targetUid,
        senderId: auth.currentUser.uid,
        type: 'alert',
        status: 'unread',
        message: `You were added to business "${activeWorkspace.name}" as a ${inviteRole}.`,
        createdAt: new Date().toISOString()
      });

      setInviteEmail('');
      Alert.alert('Success', 'Member invited successfully!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Workspaces</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create New Business</Text>
          <Text style={styles.cardDesc}>Start a new shared ledger for your business to collaborate with partners and staff.</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Business Name"
            value={newBizName}
            onChangeText={setNewBizName}
          />
          <TouchableOpacity 
            style={[styles.btn, loading && { opacity: 0.7 }]} 
            onPress={handleCreateBusiness}
            disabled={loading}
          >
            <Text style={styles.btnText}>Create Business</Text>
          </TouchableOpacity>
        </View>

        {!isPersonal && isAdmin && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Manage Members</Text>
            <Text style={styles.cardDesc}>Invite staff to "{activeWorkspace.name}"</Text>
            
            <TextInput
              style={styles.input}
              placeholder="User Email"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.roleContainer}>
              {['partner', 'sender', 'receiver', 'viewer'].map(r => (
                <TouchableOpacity 
                  key={r}
                  style={[styles.roleChip, inviteRole === r && styles.roleChipActive]}
                  onPress={() => setInviteRole(r)}
                >
                  <Text style={[styles.roleChipText, inviteRole === r && styles.roleChipTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.btn, loading && { opacity: 0.7 }]} 
              onPress={handleInviteMember}
              disabled={loading}
            >
              <Text style={styles.btnText}>Invite Member</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isPersonal && !isAdmin && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Business Info</Text>
            <Text style={styles.cardDesc}>You are a {activeWorkspace.roles[auth.currentUser?.uid]} in "{activeWorkspace.name}". Only admins can manage members.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backBtn: { marginRight: 15 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  card: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOffset: { w: 0, h: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  cardDesc: { fontSize: 14, color: COLORS.textLight, marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  btn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 10 },
  roleChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleChipText: { color: COLORS.text, textTransform: 'capitalize' },
  roleChipTextActive: { color: COLORS.white, fontWeight: 'bold' }
});
