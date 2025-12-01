import mongoose, { Schema } from 'mongoose';

const LeadSchema = new Schema(
  {
    name: { type: String, default: '' },
    website: { type: String, default: '' },
    emails: { type: [String], default: [] },
    validatedEmails: { type: [String], default: [] }, // optional validated results
    phones: { type: [String], default: [] },
    address: { type: String, default: '' },
    sourceActor: { type: String, default: '' },
    raw: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Indexes for searching/dedupe
LeadSchema.index({ website: 1 });
LeadSchema.index({ emails: 1 });

const Lead = mongoose.model('Lead', LeadSchema);
export default Lead;
