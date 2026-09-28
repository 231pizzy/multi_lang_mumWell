import mongoose from "mongoose";

// EPDS (Edinburgh Postnatal Depression Scale) screening results.
// One document per attempt, so score history is preserved.
const testSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true, min: 0, max: 30 },
    level: { type: String, trim: true },
    message: { type: String, trim: true },
    // Per-question scores (0–3). Question 10 is the self-harm item.
    answers: { type: [Number], default: undefined },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

testSchema.index({ userId: 1, timestamp: -1 });

// The collection name "tests" matches the model name used by the previous backend.
export const Test = mongoose.model("test", testSchema);
