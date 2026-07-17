const USE_MOCK = process.env.USE_MOCK_APIS === 'true';

export const verifyEOBI = async (eobiNumber: string) => {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 700));
    
    if (eobiNumber.startsWith('999')) {
      return { status: 'not_found', mock: true };
    }
    
    return { 
      status: 'verified', 
      mock: true, 
      eobiNumber, 
      employeeName: 'Muhammad Usman', 
      employerId: 'uuid-placeholder', 
      contributionStatus: 'Active', 
      lastContributionDate: new Date().toISOString().split('T')[0]
    };
  }
  
  return { status: 'pending', mock: false };
};
