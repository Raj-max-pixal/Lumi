import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, realtimeDb } from '../config/firebase';
import { COLORS, RADIUS, SPACING, FONTS } from '../config/theme';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  async function handleAuth() {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Missing Info', 'Enter a valid email and password (min 6 chars).');
      return;
    }
    if (!isLogin && !name.trim()) {
      Alert.alert('Missing Info', 'Enter your display name.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const avatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(cred.user.uid)}`;
        await updateProfile(cred.user, {
          displayName: name.trim(),
          photoURL: avatar,
        });
        const username = `@${email.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase()}`;
        // Save profile to Firebase
        const profileRef = ref(realtimeDb, `publicProfiles/${cred.user.uid}`);
        const existing = await get(profileRef);
        if (!existing.exists()) {
          await set(profileRef, {
            name: name.trim(),
            avatar,
            username,
            bio: '',
            city: '',
            skills: [],
            interests: [],
          });
        }
      }
    } catch (err: any) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'This email is already registered. Try signing in.'
          : err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
          ? 'Invalid email or password.'
          : err.message || 'Something went wrong. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={['#1a0533', '#0d0521', '#050505']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={[COLORS.purple, COLORS.cyan]}
              style={styles.logoCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="code-slash" size={36} color="#fff" />
            </LinearGradient>
            <Text style={styles.logoText}>Lumi</Text>
            <Text style={styles.tagline}>The social network for developers</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Name</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    ref={nameRef}
                    style={styles.input}
                    placeholder="Full name"
                    placeholderTextColor={COLORS.textDim}
                    value={name}
                    onChangeText={setName}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="dev@example.com"
                  placeholderTextColor={COLORS.textDim}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, styles.inputFlex]}
                  placeholder="Min 6 characters"
                  placeholderTextColor={COLORS.textDim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleAuth}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.authBtn, loading && styles.authBtnDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[COLORS.purple, '#7C3AED']}
                style={styles.authBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.authBtnText}>
                    {isLogin ? 'Sign In to Lumi' : 'Create Developer Account'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.terms}>
              For developers only. Share code, projects, and ideas.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            {[
              { icon: 'code-slash', label: 'Share your code & projects' },
              { icon: 'people', label: 'Follow other developers' },
              { icon: 'flash', label: 'AI tools for devs' },
              { icon: 'trophy', label: 'Hackathon showcase' },
            ].map((f) => (
              <View key={f.label} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={16} color={COLORS.purple} />
                </View>
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.base,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoSection: { alignItems: 'center', marginBottom: SPACING['2xl'] },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 3,
    marginBottom: SPACING.base,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: COLORS.purple },
  toggleText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textMuted },
  toggleTextActive: { color: '#fff' },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    height: 48,
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
  },
  inputFlex: { flex: 1 },
  eyeBtn: { padding: 4 },
  authBtn: { marginTop: SPACING.sm, borderRadius: RADIUS.full, overflow: 'hidden' },
  authBtnDisabled: { opacity: 0.7 },
  authBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  authBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
  terms: {
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    color: COLORS.textDim,
    marginTop: SPACING.md,
  },
  features: { width: '100%', gap: SPACING.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.purpleDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '500' },
});
