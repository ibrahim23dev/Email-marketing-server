import { Lead, ILead } from '../models/lead.model';
import { ApiError } from '../utils/api-error';

export class LeadService {
  async createLead(leadData: Partial<ILead>) {
    const existingLead = await Lead.findOne({ email: leadData.email });
    if (existingLead) throw new ApiError(409, 'Lead with this email already exists');
    return await Lead.create(leadData);
  }

  async getLeads(query: any, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (query.country) filter.country = query.country;
    if (query.industry) filter.industry = query.industry;
    if (query.status) filter.status = query.status;
    if (query.verified !== undefined) filter.verified = query.verified === 'true';

    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Lead.countDocuments(filter);

    return { total, page, limit, totalPages: Math.ceil(total / limit), data: leads };
  }

  async updateLeadStatus(id: string, status: string) {
    const lead = await Lead.findByIdAndUpdate(id, { status }, { new: true });
    if (!lead) throw new ApiError(404, 'Lead not found');
    return lead;
  }
}
