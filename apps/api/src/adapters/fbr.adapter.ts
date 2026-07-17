const USE_MOCK = process.env.USE_MOCK_APIS !== 'false'; // Default to true for demo

export const verifyNTN = async (ntn: string) => {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 600));
    
    // Deterministic mock based on last character
    // For demo purposes, always return verified to prevent registration friction
    return { 
      status: 'verified', 
      mock: true, 
      ntn, 
      businessName: 'Demo Employer Inc', 
      registrationDate: '2010-01-01', 
      filerStatus: 'Active' 
    };
  }
  
  return { status: 'pending', mock: false };
};
