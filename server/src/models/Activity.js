import mongoose from "mongoose";

export const ACTIVITY_TYPES = [
  "meditation",
  "exercise",
  "walking",
  "reading",
  "journaling",
  "therapy",
  "game",
];

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true, enum: ACTIVITY_TYPES },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    duration: { type: Number, min: 0 },
    completed: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

activitySchema.index({ userId: 1, timestamp: -1 });

export const Activity = mongoose.model("Activity", activitySchema);
