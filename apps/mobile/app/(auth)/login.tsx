import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
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
      // Mock OTP sending — in prod this calls /api/auth/send-otp
      await new Promise(r => setTimeout(r, 1000));
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
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
      // Mock OTP verification — use phone as credential
      // In prod this calls /api/auth/verify-otp
      const res = await api.post('/auth/login', {
        email: `${phone.replace(/\D/g, '')}@mobile.wwb`,
        password: otp,
      });
      const payload = res?.data || res;
      if (payload?.accessToken) {
        await setTokens(payload.accessToken, payload.refreshToken);
        router.replace('/(app)');
      } else {
        // For demo: if backend doesn't have mobile auth, use mock
        await setTokens('mock-token-' + Date.now(), 'mock-refresh-' + Date.now());
        router.replace('/(app)');
      }
    } catch {
      // For demo, allow any 6-digit OTP
      await setTokens('mock-token-' + Date.now(), 'mock-refresh-' + Date.now());
      router.replace('/(app)');
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
                <TouchableOpacity onPress={() => setStep('phone')} style={styles.backLink}>
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
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  content: { padding: 20, paddingTop: 32, gap: 20 },
  logoCard: {
    backgroundColor: '#003366',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#004080',
  },
  seal: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 3, borderColor: '#C8A951',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  sealText: { color: '#C8A951', fontSize: 32, fontWeight: '700' },
  heading: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  subheading: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4, letterSpacing: 1, textAlign: 'center' },
  divider: { width: 40, height: 2, backgroundColor: '#C8A951', marginVertical: 16 },
  disclaimer: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500', letterSpacing: 0.5, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#E5E7EB' },
  label: { fontSize: 15, fontWeight: '700', color: '#003366', marginBottom: 4 },
  hint: { fontSize: 12, color: '#6B7A8D', marginBottom: 12 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    height: 52, paddingHorizontal: 16, fontSize: 16, color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  otpInput: { fontSize: 24, fontWeight: '700', letterSpacing: 8, textAlign: 'center' },
  expiry: { fontSize: 12, color: '#E6A817', marginTop: 6, fontWeight: '500' },
  error: { color: '#C8202F', fontSize: 13, marginTop: 8, fontWeight: '500' },
  btn: {
    backgroundColor: '#003366', height: 52, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink: { marginTop: 12, alignItems: 'center' },
  backLinkText: { color: '#003366', fontSize: 14, fontWeight: '600' },
  registerRow: { marginTop: 24, borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 16, alignItems: 'center' },
  registerLink: { color: '#C8A951', fontSize: 14, fontWeight: '700' },
});
