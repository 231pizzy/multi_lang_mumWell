import mongoose from "mongoose";

// One document per check-in, so mood history is preserved.
const moodSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    note: { type: String, trim: true, maxlength: 1000 },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

moodSchema.index({ userId: 1, timestamp: -1 });

export const Mood = mongoose.model("Mood", moodSchema);
