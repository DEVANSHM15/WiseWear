import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Lock, Mail, Sparkles, User, X } from 'lucide-react-native';
import { isSupabaseConfigured, supabase } from '@/services/supabase';
import { Colors, Radius, Spacing, Typography } from '@/theme/colors';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onAuthSuccess,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuth = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Supabase credentials are not configured. You are in Demo Mode.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() || 'Wardrobe User' },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }

      onAuthSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isSignUp ? 'Create WearWise Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignUp
                  ? 'Sync your wardrobe across all your devices'
                  : 'Sign in to access your digital wardrobe'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Demo Mode Notice if Supabase is not configured */}
          {!isSupabaseConfigured && (
            <View style={styles.demoNotice}>
              <Sparkles size={16} color="#8A5D0E" />
              <View style={styles.demoNoticeTextGroup}>
                <Text style={styles.demoNoticeTitle}>Demo Mode Active</Text>
                <Text style={styles.demoNoticeBody}>
                  Supabase credentials are not configured in .env. Your wardrobe
                  is saved safely in local storage on this device.
                </Text>
              </View>
            </View>
          )}

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>YOUR NAME</Text>
                <View style={styles.inputWrapper}>
                  <User size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Alex Vance"
                    placeholderTextColor={Colors.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="alex@example.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAuth}
              disabled={loading || !isSupabaseConfigured}
              style={[
                styles.submitButton,
                (!isSupabaseConfigured || loading) ? styles.submitButtonDisabled : null,
              ]}>
              {loading ? (
                <ActivityIndicator color={Colors.textInverse} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignUp ? 'Create Free Account' : 'Sign In to Wardrobe'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Sign In / Sign Up */}
            <TouchableOpacity
              onPress={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage('');
              }}
              style={styles.toggleRow}>
              <Text style={styles.toggleText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Create One"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl * 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.round,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: '#FAF5EA',
    borderWidth: 1,
    borderColor: '#E6D7B8',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  demoNoticeTextGroup: {
    flex: 1,
  },
  demoNoticeTitle: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '700',
    color: '#7D581A',
  },
  demoNoticeBody: {
    fontSize: Typography.fontSize.xs,
    color: '#8A6828',
    lineHeight: 18,
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.danger,
    fontWeight: '600',
  },
  form: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm + 1,
    fontWeight: '700',
  },
  toggleRow: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  toggleText: {
    fontSize: Typography.fontSize.xs + 1,
    color: Colors.accent,
    fontWeight: '600',
  },
});
