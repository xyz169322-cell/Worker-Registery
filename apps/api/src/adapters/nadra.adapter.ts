const USE_MOCK = process.env.USE_MOCK_APIS !== 'false'; // Default to true for demo

export const verifyNADRA = async (cnic: string) => {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    
    // For demo purposes, always return verified to prevent registration friction
    return { status: 'verified', mock: true, cnic, fullName: 'Demo Worker', dob: '1985-05-15', district: 'Lahore' };
  }
  
  // REAL API placeholder
  return { status: 'pending', mock: false };
};
