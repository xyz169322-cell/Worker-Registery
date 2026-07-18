const USE_MOCK = process.env.USE_MOCK_APIS !== 'false'; // Default true for demo

export const sendOTP = async (phone: string, otp: string) => {
  return sendNotification(phone, `Your Workers Welfare Board verification code is ${otp}. Valid for 5 minutes.`);
};

export const sendNotification = async (phone: string, message: string) => {
  if (USE_MOCK) {
    console.log(`
  ==============================
  [SMS MOCK] 
  To: ${phone}
  Message: ${message}
  Time: ${new Date().toISOString()}
  ==============================
`);
    return { sent: true, mock: true, messageId: 'mock_' + Date.now() };
  }
  
  // Real Twilio API integration would go here
  return { sent: false, mock: false, error: 'Not implemented' };
};
