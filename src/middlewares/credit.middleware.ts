import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import User from '../models/user.model';

export const checkCreditsBeforeScrape = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ ok: false, error: 'User not found' });
      return;
    }

    const COST_PER_SCRAPE = 100; // Configurable cost
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const timeSinceRegistration = new Date().getTime() - new Date(user.trialStartDate).getTime();
    
    const isWithinTrialDuration = timeSinceRegistration <= threeDaysMs;
    const hasTrialScrapes = user.scrapeCount < 3;
    
    // Check trial conditions
    if (!user.isPremium) {
      // In trial phase
      if (isWithinTrialDuration && hasTrialScrapes) {
         // Good to go, proceeding to consume trial execution.
         // We will still ensure they have sufficient credits to cover the scrape
         if (user.credits < COST_PER_SCRAPE) {
            res.status(403).json({ ok: false, error: 'No credits left. Upgrade required to generate leads' });
            return;
         }
      } else {
        // Trial expired or scrape limits exceeded, fall back to check if they have general credits
        if (user.credits < COST_PER_SCRAPE) {
           res.status(403).json({ ok: false, error: 'Trial expired. Upgrade required to generate leads' });
           return;
        }
      }
    } else {
      // Premium users just need credits
      if (user.credits < COST_PER_SCRAPE) {
         res.status(403).json({ ok: false, error: 'Insufficient credits. Upgrade required to generate leads' });
         return;
      }
    }

    // Attach user to req to avoid refetching
    (req as any).dbUser = user;
    next();
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to verify credits' });
  }
};
