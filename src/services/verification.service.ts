export class VerificationService {
  // Mocking SMTP / Logic check
  async verifyEmailPattern(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    // TODO: In production, integrate external SMTP lib (e.g. bounce-buster, Hunter.io)
    // For now, simulate async network delay and check
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Artificial logic: reject disposable domains
    const disposableDomains = ['tempmail.com', '10minutemail.com'];
    const domain = email.split('@')[1];
    if (disposableDomains.includes(domain)) return false;

    return true; 
  }
}
