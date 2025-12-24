import axios from 'axios';
import logger from './logger';

const EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function validateEmails(emails: string[]): Promise<string[]> {
  const apiKey = process.env.EMAIL_VALIDATOR_API_KEY;

  if (!apiKey) {
    logger.info('EMAIL_VALIDATOR_API_KEY not set → skipping validation');
    return emails;
  }

  // 1️⃣ Basic sanity filtering (save API cost)
  const filteredEmails = emails
    .map(e => e.trim().toLowerCase())
    .filter(e => EMAIL_REGEX.test(e));

  if (!filteredEmails.length) return [];

  try {
    // 2️⃣ Parallel validation (safe batch)
    const requests = filteredEmails.map(email =>
      axios.get(
        'https://api.neverbounce.com/v4/single/check',
        {
          params: {
            key: apiKey,
            email
          },
          timeout: 8000
        }
      )
      .then(res => ({ email, data: res.data }))
      .catch(() => null) // ignore individual failures
    );

    const responses = await Promise.all(requests);

    // 3️⃣ Collect valid emails
    const validEmails: string[] = [];

    for (const r of responses) {
      if (!r || !r.data) continue;

      // NeverBounce response example
      if (r.data.result === 'valid') {
        validEmails.push(r.email);
      }
    }

    logger.info(
      `Email validation: ${validEmails.length}/${filteredEmails.length} valid`
    );

    return validEmails;
  } catch (err: any) {
    logger.error('validateEmails failed:', err?.message || err);
    return filteredEmails; // fail-open
  }
}
