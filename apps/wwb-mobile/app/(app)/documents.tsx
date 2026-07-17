import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Share, Alert, Platform, Clipboard, Animated
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { GovHeader } from '../../components/GovHeader';
import { useI18n } from '../../lib/i18n';
import { Share2, CheckCircle2, Copy, QrCode, RotateCcw } from 'lucide-react-native';
import { useWorker } from '../../lib/WorkerContext';

export default function DocumentsScreen() {
  const { t, isRtl } = useI18n();
  const [copied, setCopied] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Animation value
  const flipAnim = useRef(new Animated.Value(0)).current;

  const flipCard = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  const { worker } = useWorker();

  const workerData = worker ? {
    name: worker.full_name,
    cnic: worker.cnic,
    employer: worker.employer_name || 'Individual',
    regNo: worker.wwb_reg_no,
    eobi: worker.eobi_number || 'N/A',
    socialSecurity: worker.social_security_no || 'N/A',
    joined: worker.date_of_joining ? new Date(worker.date_of_joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
    district: worker.district || 'N/A',
    status: worker.verification_status,
  } : {
    name: '-',
    cnic: '-',
    employer: '-',
    regNo: '-',
    eobi: '-',
    socialSecurity: '-',
    joined: '-',
    district: '-',
    status: 'pending',
  };

  const verifyUrl = workerData.regNo !== '-' ? `https://wwb.punjab.gov.pk/verify?reg=${workerData.regNo}` : 'https://wwb.punjab.gov.pk';

  const handleShare = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        title: 'WWB Worker ID Card',
        message:
          `Workers Welfare Board — Industrial Worker ID Card\n\n` +
          `Name: ${workerData.name}\n` +
          `CNIC: ${workerData.cnic}\n` +
          `WWB Reg No: ${workerData.regNo}\n` +
          `Verify at: ${verifyUrl}`,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share card.');
    }
  };

  const handleCopyUrl = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(verifyUrl).catch(() => {});
    } else {
      Clipboard.setString(verifyUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <GovHeader onBack={() => {}} />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, isRtl && styles.rtlText]}>{t.myCard}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Share2 size={16} color="#0A5C36" />
            <Text style={styles.shareBtnText}>{t.shareCard}</Text>
          </TouchableOpacity>
        </View>

        {/* 3D FLIP CONTAINER */}
        <View style={styles.flipContainer}>
          {/* FRONT OF CARD */}
          <Animated.View style={[styles.idCard, styles.cardFront, frontAnimatedStyle]}>
            <View style={styles.cardHeader}>
              <View style={styles.seal}>
                <Text style={styles.sealText}>و</Text>
              </View>
              <View style={styles.cardTitleBlock}>
                <Text style={styles.cardGovt}>{t.govt}</Text>
                <Text style={styles.cardWwb}>{t.appName}</Text>
                <Text style={styles.cardSubtitle}>Industrial Worker Registration Card</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ VERIFIED</Text>
              </View>
            </View>
            <View style={styles.goldLine} />

            <View style={styles.cardBody}>
              <View style={styles.photoColumn}>
                <View style={styles.photoBox}>
                  <Text style={styles.photoPlaceholder}>Photo</Text>
                </View>
              </View>

              <View style={styles.details}>
                <Text style={styles.label}>Full Name</Text>
                <Text style={styles.value}>{workerData.name}</Text>

                <Text style={styles.label}>CNIC Number</Text>
                <Text style={styles.valueCnic}>{workerData.cnic}</Text>

                <Text style={styles.label}>Employer</Text>
                <Text style={styles.value}>{workerData.employer}</Text>

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>WWB Reg. No.</Text>
                    <Text style={styles.valueSmall}>{workerData.regNo}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Date Joined</Text>
                    <Text style={styles.valueSmall}>{workerData.joined}</Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.flipBtn} onPress={flipCard}>
              <RotateCcw size={16} color="#0A5C36" />
              <Text style={styles.flipBtnText}>Tap to Flip</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* BACK OF CARD */}
          <Animated.View style={[styles.idCard, styles.cardBack, backAnimatedStyle]}>
            <View style={[styles.cardHeader, { backgroundColor: '#074226' }]}>
              <Text style={styles.cardWwb}>Scan & Verify</Text>
            </View>
            <View style={styles.goldLine} />

            <View style={styles.cardBodyBack}>
              <TouchableOpacity style={styles.qrBoxLarge} onPress={handleCopyUrl}>
                <QrCode size={120} color="#0A5C36" />
                <Text style={styles.qrLabelLarge}>TAP TO COPY LINK</Text>
              </TouchableOpacity>

              <View style={styles.backDetails}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>EOBI No.</Text>
                    <Text style={styles.valueSmall}>{workerData.eobi}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>S.S. No.</Text>
                    <Text style={styles.valueSmall}>{workerData.socialSecurity}</Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.urlBar} onPress={handleCopyUrl}>
              <Text style={styles.urlText} numberOfLines={1}>{verifyUrl}</Text>
              {copied ? <CheckCircle2 size={16} color="#1D9E75" /> : <Copy size={16} color="#6B7A8D" />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.flipBtn} onPress={flipCard}>
              <RotateCcw size={16} color="#0A5C36" />
              <Text style={styles.flipBtnText}>Back to Front</Text>
            </TouchableOpacity>
            
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>
                Digitally verifiable · Workers Welfare Board Ordinance 1971
              </Text>
            </View>
          </Animated.View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },

  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EAF3DE', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: '#C8E6C9',
  },
  shareBtnText: { color: '#0A5C36', fontWeight: '600', fontSize: 13 },

  flipContainer: { height: 260 },
  idCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E2E8F0',
    elevation: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16,
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backfaceVisibility: 'hidden',
  },
  cardFront: {},
  cardBack: {},

  cardHeader: {
    backgroundColor: '#0A5C36', flexDirection: 'row',
    alignItems: 'center', padding: 16, gap: 12,
  },
  seal: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2, borderColor: '#D4AF37',
    alignItems: 'center', justifyContent: 'center',
  },
  sealText: { color: '#D4AF37', fontSize: 22, fontWeight: '700' },
  cardTitleBlock: { flex: 1 },
  cardGovt: {
    color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  cardWwb: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cardSubtitle: { color: '#D4AF37', fontSize: 9, fontWeight: '600', marginTop: 2 },
  verifiedBadge: {
    backgroundColor: '#1D9E75', paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 6,
  },
  verifiedText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  goldLine: { height: 4, backgroundColor: '#D4AF37' },

  cardBody: { padding: 16, flexDirection: 'row', gap: 16 },
  cardBodyBack: { padding: 24, alignItems: 'center', gap: 16, flex: 1 },

  photoColumn: { alignItems: 'center', gap: 10, width: 90 },
  photoBox: {
    width: 80, height: 96, backgroundColor: '#F1F5F9',
    borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
  },
  photoPlaceholder: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },

  qrBoxLarge: {
    alignItems: 'center', gap: 8,
    padding: 16, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
  },
  qrLabelLarge: { fontSize: 12, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  backDetails: { width: '100%', marginTop: 'auto' },
  details: { flex: 1 },
  row: { flexDirection: 'row', marginTop: 4, gap: 8 },
  label: {
    fontSize: 9, color: '#64748B', fontWeight: '700',
    textTransform: 'uppercase', marginBottom: 1, marginTop: 8, letterSpacing: 0.5,
  },
  value: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  valueCnic: { fontSize: 13, fontWeight: '700', color: '#0A5C36', letterSpacing: 1 },
  valueSmall: { fontSize: 11, fontWeight: '600', color: '#334155' },

  flipBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, backgroundColor: '#F1F5F9',
    borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 'auto'
  },
  flipBtnText: { fontSize: 12, fontWeight: '600', color: '#0A5C36', textTransform: 'uppercase', letterSpacing: 0.5 },

  urlBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  urlText: { flex: 1, fontSize: 11, color: '#475569', fontFamily: 'monospace' },

  cardFooter: {
    backgroundColor: '#F8FAFC', padding: 8,
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 8, color: '#94A3B8', fontStyle: 'italic',
    textAlign: 'center', lineHeight: 12,
  },
});
