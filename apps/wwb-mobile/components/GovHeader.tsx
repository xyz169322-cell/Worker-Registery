import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useI18n } from '../lib/i18n';

interface Props {
  onBack?: () => void;
  showLangToggle?: boolean;
}

export function GovHeader({ onBack, showLangToggle = true }: Props) {
  const { t, lang, setLang, isRtl } = useI18n();

  return (
    <View style={styles.header}>
      <View style={[styles.row, isRtl && styles.rowReverse]}>
        {/* Logo circle */}
        <View style={styles.logo}>
          <Text style={styles.logoText}>و</Text>
        </View>

        <View style={styles.titleBlock}>
          <Text style={[styles.title, isRtl && styles.rtlText]}>{t.appName}</Text>
          <Text style={[styles.subtitle, isRtl && styles.rtlText]}>{t.govt}</Text>
        </View>

        {showLangToggle && (
          <TouchableOpacity
            onPress={() => setLang(lang === 'ur' ? 'en' : 'ur')}
            style={styles.langBtn}
            accessibilityLabel="Toggle language"
          >
            <Text style={styles.langText}>{lang === 'ur' ? 'EN' : 'اردو'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Gold bottom border */}
      <View style={styles.goldBorder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#0A5C36',
    paddingTop: 52,
    paddingBottom: 0,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    gap: 12,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: '700',
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  langBtn: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '700',
  },
  goldBorder: {
    height: 3,
    backgroundColor: '#D4AF37',
  },
});
