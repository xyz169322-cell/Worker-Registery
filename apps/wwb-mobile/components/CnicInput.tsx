import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { CheckCircle, XCircle } from 'lucide-react-native';

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  isRtl?: boolean;
}

function formatCnic(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function isValidCnic(cnic: string): boolean {
  const digits = cnic.replace(/-/g, '');
  if (digits.length !== 13) return false;
  const arr = digits.split('').map(Number);
  const check = arr[12];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += (i % 2 === 0) ? arr[i] : arr[i] * 2 > 9 ? arr[i] * 2 - 9 : arr[i] * 2;
  }
  return (10 - (sum % 10)) % 10 === check;
}

export function CnicInput({ value, onChange, label, placeholder = '00000-0000000-0', error, isRtl }: Props) {
  const [touched, setTouched] = useState(false);

  const handleChange = (text: string) => {
    onChange(formatCnic(text));
  };

  const isFull = value.length === 15;
  const isValid = isFull && isValidCnic(value);

  return (
    <View>
      {label ? <Text style={[styles.label, isRtl ? styles.rtl : null]}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          touched && isFull && isValid ? styles.inputValid : null,
          touched && isFull && !isValid ? styles.inputInvalid : null,
          error ? styles.inputInvalid : null,
        ]}
      >
        <TextInput
          style={[styles.input, isRtl ? styles.rtl : null]}
          value={value}
          onChangeText={handleChange}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          keyboardType="numeric"
          maxLength={15}
          placeholderTextColor="#9CA3AF"
        />
        {touched && isFull ? (
          isValid
            ? <CheckCircle size={20} color="#1D9E75" />
            : <XCircle size={20} color="#C8202F" />
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  rtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    height: 50,
    gap: 8,
  },
  inputValid: {
    borderColor: '#1D9E75',
  },
  inputInvalid: {
    borderColor: '#C8202F',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#111827',
    letterSpacing: 1,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: '#C8202F',
    fontWeight: '500',
  },
});
