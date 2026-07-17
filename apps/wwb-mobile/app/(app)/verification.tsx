import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { GovHeader } from '../../components/GovHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useI18n } from '../../lib/i18n';
import { useWorker } from '../../lib/WorkerContext';

// The 8 departments that must verify a worker — used to overlay real data
const ALL_DEPARTMENTS = [
  { key: 'Labour',          label: 'Labour Department' },
  { key: 'Police',          label: 'Police' },
  { key: 'EOBI',            label: 'EOBI' },
  { key: 'Social Security', label: 'Social Security' },
  { key: 'FBR',             label: 'FBR (Tax Authority)' },
  { key: 'Excise',          label: 'Excise & Taxation' },
  { key: 'Civil Defense',   label: 'Civil Defense' },
  { key: 'District Admin',  label: 'District Administration' },
];

export default function VerificationScreen() {
  const { t, isRtl } = useI18n();
  const { worker, loading } = useWorker();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0A5C36" />
      </View>
    );
  }

  // Build a map of department → verification record from real data
  const verifiedMap: Record<string, { status: string; date: string }> = {};
  if (worker?.verifications) {
    for (const v of worker.verifications) {
      const dept = v.department as string;
      verifiedMap[dept] = {
        status: v.status === 'approved' ? 'verified' : v.status,
        date: v.verified_at ? new Date(v.verified_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      };
    }
  }

  const verifiedCount = Object.values(verifiedMap).filter(v => v.status === 'verified').length;
  const totalDepts = ALL_DEPARTMENTS.length;

  return (
    <View style={styles.container}>
      <GovHeader onBack={() => {}} />
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={[styles.pageTitle, isRtl && styles.rtlText]}>{t.verificationStatus}</Text>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Departments Cleared</Text>
            <View style={styles.summaryCountRow}>
              <Text style={styles.summaryCount}>{verifiedCount}</Text>
              <Text style={styles.summaryTotal}> / {totalDepts}</Text>
            </View>
          </View>
          <StatusBadge status={worker?.verification_status || 'pending'} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(verifiedCount / totalDepts) * 100}%` as any }]} />
        </View>

        {/* Department List */}
        <View style={styles.card}>
          {ALL_DEPARTMENTS.map((dept, index) => {
            const record = verifiedMap[dept.key];
            const status = record?.status || 'pending';
            const date = record?.date || null;
            const dotColor = status === 'verified' ? '#1D9E75' : status === 'flagged' ? '#DC2626' : '#F59E0B';

            return (
              <View
                key={dept.key}
                style={[
                  styles.deptRow,
                  index !== ALL_DEPARTMENTS.length - 1 && styles.borderBottom,
                  isRtl && styles.rtlRow,
                ]}
              >
                {/* Status Dot */}
                <View style={[styles.dot, { backgroundColor: dotColor }]} />

                <View style={[styles.deptInfo, isRtl && styles.rtlInfo]}>
                  <Text style={[styles.deptName, isRtl && styles.rtlText]}>{dept.label}</Text>
                  {date ? (
                    <Text style={[styles.date, isRtl && styles.rtlText]}>Completed: {date}</Text>
                  ) : (
                    <Text style={[styles.datePending, isRtl && styles.rtlText]}>Awaiting officer review</Text>
                  )}
                </View>

                <StatusBadge
                  status={status}
                  label={status === 'verified' ? t.verified : status === 'flagged' ? 'Flagged' : t.pending}
                />
              </View>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },

  summaryCard: {
    backgroundColor: '#0A5C36', borderRadius: 14, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryCountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  summaryCount: { fontSize: 40, fontWeight: '800', color: '#fff' },
  summaryTotal: { fontSize: 20, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  progressTrack: {
    height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#D4AF37', borderRadius: 4 },

  card: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  deptRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rtlRow: { flexDirection: 'row-reverse' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  deptInfo: { flex: 1 },
  rtlInfo: { alignItems: 'flex-end' },
  deptName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  date: { fontSize: 12, color: '#1D9E75', marginTop: 2, fontWeight: '500' },
  datePending: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
