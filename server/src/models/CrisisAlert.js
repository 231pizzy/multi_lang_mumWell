import mongoose from "mongoose";

// Audit trail of every crisis event and whether the helpline was emailed. Kept so the team
// can show what was escalated and when; erased with the account (GDPR Art. 17).
const crisisAlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reference: { type: String, required: true },
    source: { type: String, enum: ["chat", "screening", "consultation", "mood"], required: true },
    reasons: { type: [String], default: [] },
    riskLevel: { type: Number, min: 0, max: 10 },
    excerpt: { type: String, maxlength: 2000 },
    sessionId: { type: String },
    emailStatus: {
      type: String,
      enum: ["sent", "failed", "suppressed", "disabled", "not_configured"],
      required: true,
    },
    emailedTo: { type: String },
    // Contact details she chose to share in the conversation after the crisis was flagged.
    sharedAddress: { type: String, maxlength: 300 },
    sharedPhone: { type: String, maxlength: 40 },
    contactSharedAt: { type: Date },
    updateEmailStatus: { type: String, enum: ["sent", "failed", "not_sent"] },
  },
  { timestamps: true },
);

crisisAlertSchema.index({ userId: 1, createdAt: -1 });

export const CrisisAlert = mongoose.model("CrisisAlert", crisisAlertSchema);
