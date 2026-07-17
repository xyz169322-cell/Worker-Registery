import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { GovHeader } from '../../components/GovHeader';
import { useI18n } from '../../lib/i18n';
import { useWorker } from '../../lib/WorkerContext';
import { User, Building2, CreditCard, MapPin } from 'lucide-react-native';

export default function ProfileScreen() {
  const { t, isRtl } = useI18n();
  const { worker, loading } = useWorker();

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <View style={styles.field}>
      <Text style={[styles.label, isRtl && styles.rtlText]}>{label}</Text>
      <Text style={[styles.value, isRtl && styles.rtlText]}>{value || '—'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0A5C36" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GovHeader onBack={() => {}} />
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={[styles.pageTitle, isRtl && styles.rtlText]}>{t.myProfile}</Text>

        {/* Personal Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={16} color="#0A5C36" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <Field label={t.fullName} value={worker?.full_name} />
          <View style={styles.divider} />
          <Field label={t.cnic} value={worker?.cnic} />
          <View style={styles.divider} />
          <Field label={t.phone} value={worker?.phone} />
          <View style={styles.divider} />
          <Field label="District" value={worker?.district} />
          <View style={styles.divider} />
          <Field label={t.address} value={worker?.address} />
        </View>

        {/* Employment Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={16} color="#0A5C36" />
            <Text style={styles.sectionTitle}>Employment Details</Text>
          </View>
          <Field label={t.employer} value={worker?.employer_name} />
          <View style={styles.divider} />
          <Field label={t.jobTitle} value={worker?.job_title} />
          <View style={styles.divider} />
          <Field label="Designation" value={worker?.designation} />
          <View style={styles.divider} />
          <Field label="Pay Scale" value={worker?.pay_scale ? `Rs. ${worker.pay_scale}` : undefined} />
        </View>

        {/* Financial Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={16} color="#0A5C36" />
            <Text style={styles.sectionTitle}>Financial & Social Security</Text>
          </View>
          <Field label={t.eobiNumber} value={worker?.eobi_number} />
          <View style={styles.divider} />
          <Field label={t.ssNumber} value={worker?.social_security_no} />
          <View style={styles.divider} />
          <Field label="Payment Mode" value={worker?.payment_mode?.toUpperCase()} />
          <View style={styles.divider} />
          <Field label="Bank Name" value={worker?.bank_name} />
          <View style={styles.divider} />
          <Field label="Account / IBAN" value={worker?.bank_account} />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  section: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#0A5C36', textTransform: 'uppercase', letterSpacing: 0.5 },
  field: { paddingHorizontal: 16, paddingVertical: 12 },
  label: { fontSize: 11, color: '#64748B', marginBottom: 3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { fontSize: 15, color: '#0F172A', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
});
