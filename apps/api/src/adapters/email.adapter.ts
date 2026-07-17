const USE_MOCK = process.env.USE_MOCK_APIS === 'true';

export const sendEmail = async (to: string, subject: string, text: string) => {
  if (USE_MOCK) {
    console.log(`
  ==============================
  [EMAIL MOCK] 
  To: ${to}
  Subject: ${subject}
  Message: ${text}
  Time: ${new Date().toISOString()}
  ==============================
`);
    return { sent: true, mock: true, messageId: 'mock_email_' + Date.now() };
  }
  
  // Real Email/SMTP integration would go here
  return { sent: false, mock: false, error: 'Not implemented' };
};
