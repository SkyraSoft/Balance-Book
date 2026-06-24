import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useData } from '../context/DataContext';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';
import Icon from '@expo/vector-icons/MaterialIcons';

export default function LoginScreen() {
  const { loginUser, registerUser } = useData();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAuth = async () => {
    if (isRegistering) {
      if (!email.trim() || !password.trim() || !confirmPassword.trim() || !storeName.trim() || !phone.trim()) {
        Alert.alert('Error', 'Please fill in all fields.');
        return;
      }
      if (password.length < 8) {
        Alert.alert('Security Error', 'For your security, password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match.');
        return;
      }
      setLoading(true);
      try {
        const res = await registerUser(email, password, storeName, phone, '');
        if (res.success) {
          Alert.alert('Success', 'Account registered successfully!');
        } else {
          Alert.alert('Registration Failed', res.message || 'Something went wrong.');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to register account.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Error', 'Please fill in all credentials.');
        return;
      }
      
      setLoading(true);
      try {
        const res = await loginUser(email, password);
        if (res.success) {
          // Auth listener automatically routes to main screen
        } else {
          Alert.alert('Login Failed', res.message || 'Invalid credentials.');
        }
      } catch (error) {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.logoCircle}>
            <Icon name="menu-book" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.title}>{isRegistering ? 'Create Account' : 'Balance Book'}</Text>
          <Text style={styles.subtitle}>{isRegistering ? 'Sign up as a new merchant' : 'Enter credentials to access account'}</Text>

          {isRegistering && (
            <>
              <View style={styles.inputContainer}>
                <Icon name="store" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Business Store Name"
                  placeholderTextColor={COLORS.textMuted}
                  value={storeName}
                  onChangeText={setStoreName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="phone" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contact Phone Number"
                  placeholderTextColor={COLORS.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                />
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email or Phone Number"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Icon name={showPassword ? "visibility" : "visibility-off"} size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {isRegistering && (
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Icon name={showConfirmPassword ? "visibility" : "visibility-off"} size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.btn, loading && styles.btnDisabled]} 
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? (isRegistering ? 'Registering...' : 'Signing In...') : (isRegistering ? 'Register' : 'Sign In')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toggleBtn}
            onPress={() => setIsRegistering(!isRegistering)}
            disabled={loading}
          >
            <Text style={styles.toggleBtnText}>
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>

          {!isRegistering && (
            <View style={styles.hintContainer}>
              <Text style={styles.hintTitle}>Demo Accounts:</Text>
              <Text style={styles.hintText}>• Owner/Admin: <Text style={styles.bold}>admin@balancebook.com</Text> / <Text style={styles.bold}>123456asdfg</Text></Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
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
    marginTop: 4,
    marginBottom: SIZES.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    height: 48,
    backgroundColor: '#FAFBFC',
    marginBottom: SIZES.md,
    width: '100%',
  },
  inputIcon: {
    marginRight: SIZES.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  eyeIcon: {
    padding: SIZES.sm,
  },
  btn: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusXl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.sm,
    ...SHADOWS.sm,
  },
  btnDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  toggleBtn: {
    marginTop: SIZES.md,
    padding: 8,
  },
  toggleBtnText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  hintContainer: {
    marginTop: SIZES.xl,
    padding: SIZES.md,
    backgroundColor: '#F1F5F9',
    borderRadius: SIZES.radius,
    width: '100%',
    alignSelf: 'stretch',
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  hintText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '600',
    color: COLORS.text,
  },
});
