import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { GovHeader } from '../../components/GovHeader';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { setTokens } from '../../lib/auth';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const { t, isRtl } = useI18n();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/send-otp', { phone });
      if (res?.success) {
        setStep('otp');
      } else {
        setError(res?.message || 'Failed to send OTP');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', { phone, code: otp });
      const payload = res?.data;

      if (payload?.accessToken) {
        await setTokens(payload.accessToken, payload.refreshToken);
        router.replace('/(app)');
      } else {
        throw new Error('No access token returned');
      }
    } catch (e: any) {
      console.error(e);
      if (e.status === 404) {
        // Worker not registered — take them to register screen
        router.push({ pathname: '/(auth)/register', params: { phone } });
      } else {
        setError(e.message || 'Invalid OTP code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GovHeader />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* Logo Card */}
          <View style={styles.logoCard}>
            <View style={styles.seal}>
              <Text style={styles.sealText}>و</Text>
            </View>
            <Text style={[styles.heading, isRtl && styles.rtl]}>{t.appName}</Text>
            <Text style={[styles.subheading, isRtl && styles.rtl]}>{t.govt}</Text>
            <View style={styles.divider} />
            <Text style={[styles.disclaimer, isRtl && styles.rtl]}>{t.authorisedOnly}</Text>
          </View>

          {/* Login Form Card */}
          <View style={styles.card}>
            {step === 'phone' ? (
              <>
                <Text style={[styles.label, isRtl && styles.rtl]}>{t.phoneNumber}</Text>
                <Text style={[styles.hint, isRtl && styles.rtl]}>{t.phoneHint}</Text>
                <TextInput
                  style={[styles.input, isRtl && styles.rtl]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="03XX-XXXXXXX"
                  placeholderTextColor="#9CA3AF"
                  maxLength={12}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  accessibilityLabel={t.sendOtp}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>{t.sendOtp}</Text>
                  }
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.label, isRtl && styles.rtl]}>{t.enterOtp}</Text>
                <Text style={[styles.hint, isRtl && styles.rtl]}>{t.otpHint}</Text>
                <TextInput
                  style={[styles.input, styles.otpInput, isRtl && styles.rtl]}
                  value={otp}
                  onChangeText={v => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  placeholder="— — — — — —"
                  placeholderTextColor="#9CA3AF"
                  maxLength={6}
                  autoFocus
                />
                <Text style={[styles.expiry, isRtl && styles.rtl]}>{t.otpExpiry}</Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>{t.verifyOtp}</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); setError(''); }} style={styles.backLink}>
                  <Text style={styles.backLinkText}>{t.back}</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.registerRow}>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>{t.registerInstead}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 32, gap: 20 },
  logoCard: {
    backgroundColor: '#0A5C36',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#074226',
  },
  seal: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 3, borderColor: '#D4AF37',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  sealText: { color: '#D4AF37', fontSize: 32, fontWeight: '700' },
  heading: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  subheading: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4, letterSpacing: 1, textAlign: 'center' },
  divider: { width: 40, height: 2, backgroundColor: '#D4AF37', marginVertical: 16 },
  disclaimer: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500', letterSpacing: 0.5, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  label: { fontSize: 15, fontWeight: '700', color: '#0A5C36', marginBottom: 4 },
  hint: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  input: {
    borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8,
    height: 52, paddingHorizontal: 16, fontSize: 16, color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  otpInput: { fontSize: 24, fontWeight: '700', letterSpacing: 8, textAlign: 'center' },
  expiry: { fontSize: 12, color: '#D4AF37', marginTop: 6, fontWeight: '500' },
  error: { color: '#C8202F', fontSize: 13, marginTop: 8, fontWeight: '500' },
  btn: {
    backgroundColor: '#0A5C36', height: 52, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink: { marginTop: 12, alignItems: 'center' },
  backLinkText: { color: '#0A5C36', fontSize: 14, fontWeight: '600' },
  registerRow: { marginTop: 24, borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 16, alignItems: 'center' },
  registerLink: { color: '#D4AF37', fontSize: 14, fontWeight: '700' },
});
