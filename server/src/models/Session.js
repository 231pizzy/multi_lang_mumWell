import mongoose from "mongoose";

// A login session. Deleting the document (logout) revokes its token.
const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    deviceInfo: { type: String },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model("Session", sessionSchema);
