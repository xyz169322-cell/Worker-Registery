import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react-native';

type Status = 'verified' | 'pending' | 'flagged' | 'rejected';

interface Props {
  status: Status;
  label?: string;
  size?: 'sm' | 'md';
}

const CONFIG = {
  verified:  { bg: '#EAF3DE', text: '#27500A', Icon: CheckCircle,    iconColor: '#1D9E75' },
  pending:   { bg: '#FAEEDA', text: '#633806', Icon: Clock,           iconColor: '#E6A817' },
  flagged:   { bg: '#FCEBEB', text: '#791F1F', Icon: AlertTriangle,   iconColor: '#C8202F' },
  rejected:  { bg: '#FCEBEB', text: '#791F1F', Icon: XCircle,         iconColor: '#C8202F' },
};

export function StatusBadge({ status, label, size = 'md' }: Props) {
  const { bg, text, Icon, iconColor } = CONFIG[status];
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSm]}>
      <Icon size={isSmall ? 10 : 12} color={iconColor} strokeWidth={2.5} />
      <Text style={[styles.label, { color: text }, isSmall && styles.labelSm]}>
        {label || status.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelSm: {
    fontSize: 9,
  },
});
