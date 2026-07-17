const USE_MOCK = process.env.USE_MOCK_APIS === 'true';

export const verifyNTN = async (ntn: string) => {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 600));
    
    // Deterministic mock based on last character
    const lastChar = ntn.slice(-1);
    if (['1', '3', '5'].includes(lastChar)) {
      return { status: 'pending', mock: true };
    }
    if (lastChar === '0') {
      return { status: 'not_found', mock: true };
    }
    
    return { 
      status: 'verified', 
      mock: true, 
      ntn, 
      businessName: 'Mock Enterprise Pvt Ltd', 
      registrationDate: '2015-01-10', 
      activeStatus: 'Active', 
      taxCategory: 'Company' 
    };
  }
  
  return { status: 'pending', mock: false };
};
