import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { GovHeader } from '../../components/GovHeader';
import { CnicInput } from '../../components/CnicInput';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { setTokens } from '../../lib/auth';
import { auth } from '../../lib/firebase';
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { CheckCircle } from 'lucide-react-native';

type Step = 1 | 2 | 3 | 4;

export default function RegisterScreen() {
  const { t, isRtl } = useI18n();
  const [step, setStep] = useState<Step>(1);
  const [cnic, setCnic] = useState('');
  const [nadraName, setNadraName] = useState('');
  const [cnicLoading, setCnicLoading] = useState(false);
  const [cnicError, setCnicError] = useState('');

  const [form, setForm] = useState({
    employer: '', jobTitle: '', joiningDate: '',
    payScale: '', address: '', paymentMode: 'cash' as 'cash' | 'bank',
    bankName: '', bankAccount: '', eobiNumber: '', ssNumber: '',
  });

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const stepLabels = [t.step1, t.step2, t.step3, t.step4];

  const checkNadra = async () => {
    if (cnic.length !== 15) return;
    setCnicLoading(true);
    setCnicError('');
    try {
      const res = await api.post('/workers/public/check-cnic', { cnic });
      if (res.data?.success) {
        setNadraName(res.data.data.name);
        setStep(2);
      } else {
        throw new Error(res.data?.message || 'Verification failed');
      }
    } catch (e: any) {
      setCnicError(e.response?.data?.message || e.message || t.cnicFailed);
    } finally {
      setCnicLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('0') ? '+92' + phone.substring(1).replace(/\D/g, '') : '+' + phone.replace(/\D/g, '');
      if (Platform.OS === 'web') {
        if (!(window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        }
        const appVerifier = (window as any).recaptchaVerifier;
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
      } else {
        await new Promise(r => setTimeout(r, 1000));
      }
      setOtpSent(true);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      let idToken = 'mock-token';
      if (confirmationResult) {
        const res = await confirmationResult.confirm(otp);
        idToken = await res.user.getIdToken();
      }

      const res = await api.post('/workers/public/register', { 
        ...form, 
        cnic, 
        phone, 
        idToken,
        fullName: nadraName 
      });

      if (res.data?.success) {
        setStep(4);
      } else {
        throw new Error(res.data?.message || 'Registration failed');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || e.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {([1, 2, 3, 4] as Step[]).map(s => (
        <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]}>
          <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && <div id="recaptcha-container" />}
      <GovHeader />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {renderStepIndicator()}

          {/* Step 1 — CNIC */}
          {step === 1 && (
            <View style={styles.card}>
              <Text style={[styles.stepTitle, isRtl && styles.rtl]}>{t.step1}</Text>
              <CnicInput value={cnic} onChange={setCnic} label={t.cnic} error={cnicError} isRtl={isRtl} />
              {cnicLoading && (
                <View style={styles.checking}>
                  <ActivityIndicator size="small" color="#003366" />
                  <Text style={styles.checkingText}>{t.cnicChecking}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.btn, (cnic.length !== 15 || cnicLoading) && styles.btnDisabled]}
                onPress={checkNadra}
                disabled={cnic.length !== 15 || cnicLoading}
              >
                <Text style={styles.btnText}>{t.next}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.backLink}>
                <Text style={styles.backLinkText}>{t.loginInstead}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2 — Employment */}
          {step === 2 && (
            <View style={styles.card}>
              <Text style={[styles.stepTitle, isRtl && styles.rtl]}>{t.step2}</Text>

              {/* NADRA verified name */}
              <View style={styles.nadraCard}>
                <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t.nameFromNadra}</Text>
                <Text style={[styles.nadraName, isRtl && styles.rtl]}>{nadraName}</Text>
              </View>

              <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t.employer}</Text>
              <TextInput
                style={[styles.input, isRtl && styles.rtl]}
                value={form.employer}
                onChangeText={v => setForm({ ...form, employer: v })}
                placeholder="Company / Establishment"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t.jobTitle}</Text>
              <TextInput
                style={[styles.input, isRtl && styles.rtl]}
                value={form.jobTitle}
                onChangeText={v => setForm({ ...form, jobTitle: v })}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t.payScale}</Text>
              <TextInput
                style={[styles.input, isRtl && styles.rtl]}
                value={form.payScale}
                onChangeText={v => setForm({ ...form, payScale: v })}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t.eobiNumber}</Text>
              <TextInput
                style={[styles.input, isRtl && styles.rtl]}
                value={form.eobiNumber}
                onChangeText={v => setForm({ ...form, eobiNumber: v })}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t.paymentMode}</Text>
              <View style={styles.radioRow}>
                {(['cash', 'bank'] as const).map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.radioBtn, form.paymentMode === mode && styles.radioBtnActive]}
                    onPress={() => setForm({ ...form, paymentMode: mode })}
                  >
                    <Text style={[styles.radioText, form.paymentMode === mode && styles.radioTextActive]}>
                      {mode === 'cash' ? t.cash : t.bankTransfer}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.paymentMode === 'bank' && (
                <>
                  <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t.bankName}</Text>
                  <TextInput
                    style={[styles.input, isRtl && styles.rtl]}
                    value={form.bankName}
                    onChangeText={v => setForm({ ...form, bankName: v })}
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t.bankAccount}</Text>
                  <TextInput
                    style={[styles.input, isRtl && styles.rtl]}
                    value={form.bankAccount}
                    onChangeText={v => setForm({ ...form, bankAccount: v })}
                    placeholderTextColor="#9CA3AF"
                  />
                </>
              )}

              <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t.address}</Text>
              <TextInput
                style={[styles.input, styles.textarea, isRtl && styles.rtl]}
                value={form.address}
                onChangeText={v => setForm({ ...form, address: v })}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity style={styles.btn} onPress={() => setStep(3)}>
                <Text style={styles.btnText}>{t.next}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3 — OTP */}
          {step === 3 && (
            <View style={styles.card}>
              <Text style={[styles.stepTitle, isRtl && styles.rtl]}>{t.step3}</Text>
              <Text style={[styles.fieldLabel, isRtl && styles.rtl]}>{t.phoneNumber}</Text>
              <TextInput
                style={[styles.input, isRtl && styles.rtl]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="03XX-XXXXXXX"
                placeholderTextColor="#9CA3AF"
                editable={!otpSent}
              />
              {!otpSent ? (
                <TouchableOpacity style={styles.btn} onPress={handleSendOtp} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t.sendOtp}</Text>}
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={[styles.hint, isRtl && styles.rtl]}>{t.otpHint}</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    value={otp}
                    onChangeText={v => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t.submit}</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Step 4 — Confirmation */}
          {step === 4 && (
            <View style={[styles.card, styles.successCard]}>
              <CheckCircle size={64} color="#1D9E75" />
              <Text style={[styles.successTitle, isRtl && styles.rtl]}>{t.registrationSuccess}</Text>
              <Text style={[styles.successMsg, isRtl && styles.rtl]}>{t.registrationSuccessMsg}</Text>
              <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.btnText}>{t.login}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 20, gap: 16 },
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 8 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#0A5C36' },
  stepNum: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  stepNumActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 24,
    borderWidth: 1, borderColor: '#E2E8F0', gap: 12,
  },
  successCard: { alignItems: 'center', gap: 16 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: '#0A5C36', marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  hint: { fontSize: 12, color: '#64748B' },
  input: {
    borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8,
    height: 50, paddingHorizontal: 14, fontSize: 15, color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  textarea: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  otpInput: { fontSize: 24, fontWeight: '700', letterSpacing: 8, textAlign: 'center', height: 64 },
  checking: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  checkingText: { fontSize: 13, color: '#64748B' },
  nadraCard: {
    backgroundColor: '#EAF3DE', borderRadius: 8, padding: 14,
    borderWidth: 1, borderColor: '#1D9E75', gap: 4,
  },
  nadraName: { fontSize: 18, fontWeight: '700', color: '#27500A' },
  radioRow: { flexDirection: 'row', gap: 10 },
  radioBtn: {
    flex: 1, height: 48, borderRadius: 8, borderWidth: 1.5,
    borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center',
  },
  radioBtnActive: { borderColor: '#0A5C36', backgroundColor: '#0A5C36' },
  radioText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  radioTextActive: { color: '#fff' },
  btn: {
    backgroundColor: '#0A5C36', height: 52, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink: { alignItems: 'center', marginTop: 4 },
  backLinkText: { color: '#D4AF37', fontSize: 14, fontWeight: '600' },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#0A5C36', textAlign: 'center' },
  successMsg: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
});
