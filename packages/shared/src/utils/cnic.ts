/**
 * Formats a raw 13-digit CNIC string into the standard format 00000-0000000-0
 */
export const formatCnic = (rawCnic: string): string => {
  const digits = rawCnic.replace(/\D/g, '');
  if (digits.length !== 13) return rawCnic;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
};

/**
 * Validates if a string is a correctly formatted CNIC (00000-0000000-0)
 */
export const isValidCnic = (cnic: string): boolean => {
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  return cnicRegex.test(cnic);
};

/**
 * Extracts the province code (first digit) from a formatted or raw CNIC
 */
export const getProvinceCode = (cnic: string): string | null => {
  const digits = cnic.replace(/\D/g, '');
  if (digits.length > 0) {
    return digits[0];
  }
  return null;
};
