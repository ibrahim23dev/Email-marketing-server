import { Request, Response } from 'express';
import { LeadService } from '../services/lead.service';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/async-handler';

const leadService = new LeadService();

export class LeadController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const lead = await leadService.createLead(req.body);
    res.status(201).json(ApiResponse.success('Lead created successfully', lead));
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await leadService.getLeads(req.query, page, limit);
    res.status(200).json(ApiResponse.success('Leads fetched successfully', result));
  });

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const result = await leadService.updateLeadStatus(req.params.id, req.body.status);
    res.status(200).json(ApiResponse.success('Lead status updated', result));
  });
}
