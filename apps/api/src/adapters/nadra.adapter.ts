const USE_MOCK = process.env.USE_MOCK_APIS === 'true';

export const verifyNADRA = async (cnic: string) => {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    
    const lastDigit = parseInt(cnic.replace(/-/g, '').slice(-1));
    // Deterministic mock: last digit even = verified, odd = pending
    if (lastDigit % 2 === 0) {
      return { status: 'verified', mock: true, cnic, fullName: 'Muhammad Usman', dob: '1985-05-15', district: 'Lahore' };
    }
    if (lastDigit === 1) {
      return { status: 'not_found', mock: true };
    }
    return { status: 'pending', mock: true };
  }
  
  // REAL API placeholder
  return { status: 'pending', mock: false };
};
