import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { GovHeader } from '../../components/GovHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useI18n } from '../../lib/i18n';
import { FileText, User, ShieldCheck } from 'lucide-react-native';
import { useWorker } from '../../lib/WorkerContext';

export default function DashboardScreen() {
  const { t, isRtl } = useI18n();
  const { worker, loading } = useWorker();
  const verifiedCount = worker?.verifications?.filter((v: any) => v.status === 'approved' || v.status === 'verified').length || 0;
  const totalDepts = 8;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Failed to load worker profile.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GovHeader />
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Worker Profile Summary */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User size={24} color="#0A5C36" />
            </View>
            <View style={[styles.profileInfo, isRtl && styles.rtlInfo]}>
              <Text style={[styles.name, isRtl && styles.rtlText]}>{worker.full_name}</Text>
              <Text style={[styles.cnic, isRtl && styles.rtlText]}>{worker.cnic}</Text>
              <Text style={[styles.employer, isRtl && styles.rtlText]}>{worker.employer_name || 'Individual Registration'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, isRtl && styles.rtlText]}>{t.verificationStatus}</Text>
            <StatusBadge status={worker.verification_status} />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <Text style={[styles.statsTitle, isRtl && styles.rtlText]}>{t.deptVerified}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsNumber}>{verifiedCount}</Text>
            <Text style={styles.statsTotal}> / {totalDepts}</Text>
          </View>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(verifiedCount / totalDepts) * 100}%` }]} />
          </View>
        </View>

        {/* Navigation Grid */}
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => router.push('/(app)/profile')}
          >
            <View style={styles.iconBox}>
              <User size={28} color="#0A5C36" />
            </View>
            <Text style={[styles.gridText, isRtl && styles.rtlText]}>{t.myProfile}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => router.push('/(app)/verification')}
          >
            <View style={styles.iconBox}>
              <ShieldCheck size={28} color="#0A5C36" />
            </View>
            <Text style={[styles.gridText, isRtl && styles.rtlText]}>{t.verificationStatus}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => router.push('/(app)/documents')}
          >
            <View style={styles.iconBox}>
              <FileText size={28} color="#0A5C36" />
            </View>
            <Text style={[styles.gridText, isRtl && styles.rtlText]}>{t.myCard}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, gap: 16 },
  profileCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0',
  },
  profileInfo: { flex: 1 },
  rtlInfo: { alignItems: 'flex-end' },
  name: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  cnic: { fontSize: 14, color: '#475569', marginTop: 2, fontFamily: 'monospace' },
  employer: { fontSize: 13, color: '#64748B', marginTop: 2 },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
  
  statsCard: {
    backgroundColor: '#0A5C36', borderRadius: 12, padding: 20,
  },
  statsTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  statsNumber: { fontSize: 36, fontWeight: '700', color: '#fff' },
  statsTotal: { fontSize: 18, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginLeft: 4 },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#D4AF37', borderRadius: 3 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12,
    padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  gridText: { fontSize: 14, fontWeight: '600', color: '#334155', textAlign: 'center' },
});
