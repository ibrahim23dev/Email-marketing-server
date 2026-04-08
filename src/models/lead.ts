import mongoose, { Schema, Types } from 'mongoose';

const LeadSchema = new Schema(
  {
    /* ── Ownership ─────────────────────────────────── */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    /* ── Core fields ───────────────────────────────── */
    name:            { type: String, default: '' },
    website:         { type: String, default: '' },
    emails:          { type: [String], default: [] },
    validatedEmails: { type: [String], default: [] },
    phones:          { type: [String], default: [] },
    address:         { type: String, default: '' },
    sourceActor:     { type: String, default: '' },
    searchKeyword:   { type: String, default: '' }, // keyword that produced this lead
    raw:             { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

/* ── Indexes ────────────────────────────────────────── */
// Per-user dedup lookups

LeadSchema.index({ userId: 1, website: 1 });
LeadSchema.index({ userId: 1, emails: 1 });
// Admin / cross-user lookups
LeadSchema.index({ website: 1 });
LeadSchema.index({ emails: 1 });

const Lead = mongoose.model('Lead', LeadSchema);
export default Lead;
