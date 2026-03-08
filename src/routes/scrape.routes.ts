import { Router, Request, Response } from 'express';
import {
  startScrape,
  listLeads,
  getLead,
  deleteLead
} from '../controllers/scrape.controller';
import { authGuard, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

/* ── All routes require a valid JWT ─────────────────── */
router.use(authGuard);

/**
 * POST   /api/v1/scrape          – Run scrape pipeline & save leads for calling user
 * GET    /api/v1/leads           – List leads (own only; admins see all)
 * GET    /api/v1/leads/:id       – Get single lead (own only; admins see any)
 * DELETE /api/v1/leads/:id       – Delete lead     (own only; admins delete any)
 *
 * authGuard guarantees req.user is populated before any of these handlers run,
 * so the double-cast to `unknown` then `AuthRequest` is safe.
 */
router.post(  '/scrape',    (req: Request, res: Response) => startScrape(req as unknown as AuthRequest, res));
router.get(   '/leads',     (req: Request, res: Response) => listLeads(req as unknown as AuthRequest, res));
router.get(   '/leads/:id', (req: Request, res: Response) => getLead(req as unknown as AuthRequest, res));
router.delete('/leads/:id', (req: Request, res: Response) => deleteLead(req as unknown as AuthRequest, res));

export default router;
