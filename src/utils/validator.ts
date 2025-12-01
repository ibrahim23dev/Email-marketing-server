import axios from 'axios';
import logger from './logger';

/**
 * Simple email validator wrapper. This uses 3rd-party validation APIs like NeverBounce or ZeroBounce.
 * You need to provide EMAIL_VALIDATOR_API_KEY in .env and adapt API endpoint for the provider.
 *
 * This function accepts an array of emails and returns only the 'valid' ones (best-effort).
 */
export async function validateEmails(emails: string[]): Promise<string[]> {
  const apiKey = process.env.EMAIL_VALIDATOR_API_KEY;
  if (!apiKey) {
    logger.info('No EMAIL_VALIDATOR_API_KEY provided; skipping validation.');
    return emails;
  }

  try {
    // Example: using a hypothetical batch endpoint (replace with your provider)
    // NEVER send too many requests; provider quotas apply.
    const results: string[] = [];

    for (const e of emails) {
      // Replace below with actual provider endpoint and params
      const res = await axios.get(`https://api.neverbounce.com/v4/single/check?key=${apiKey}&email=${encodeURIComponent(e)}`);
      const data = res.data;
      // Example data structure - adapt to your provider
      if (data && data.result === 'valid') results.push(e);
    }

    logger.info('Email validation complete:', results.length, 'valid of', emails.length);
    return results;
  } catch (err: any) {
    logger.error('validateEmails error:', err?.message || err);
    // on error, return original list (fail-open)
    return emails;
  }
}
