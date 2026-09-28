import mongoose from "mongoose";

const { Schema } = mongoose;

const chatMessageSchema = new Schema(
  {
    role: { type: String, required: true, enum: ["user", "assistant"] },
    content: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    metadata: {
      analysis: Schema.Types.Mixed,
      currentGoal: String,
      progress: {
        emotionalState: String,
        riskLevel: Number,
      },
      crisis: Boolean,
    },
  },
  { _id: false },
);

const chatSessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  startTime: { type: Date, required: true, default: Date.now },
  status: {
    type: String,
    required: true,
    enum: ["active", "completed", "archived"],
    default: "active",
  },
  messages: [chatMessageSchema],
  // TTL: MongoDB deletes the session once this date passes. Unset = keep forever.
  expiresAt: { type: Date, index: { expires: 0 } },
  memory: {
    sessionContext: {
      conversationThemes: { type: [String], default: [] },
      currentTechnique: { type: String, default: null },
    },
    userProfile: {
      emotionalState: { type: [String], default: [] },
      preferences: { type: Schema.Types.Mixed, default: {} },
      riskLevel: { type: Number, default: 0 },
    },
    // Set once a crisis is flagged, so the AI asks for contact details only once.
    crisis: {
      flaggedAt: Date,
      contactAsked: { type: Boolean, default: false },
      addressShared: { type: Boolean, default: false },
    },
  },
  updatedAt: { type: Date, default: Date.now },
});

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
