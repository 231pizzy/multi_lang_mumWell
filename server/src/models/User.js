import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String },
    age: { type: Number },
    accountStatus: { type: String, enum: ["user", "admin"], default: "user" },
    password: { type: String, required: true },
    preferredLanguage: { type: String, enum: ["en", "sv", "de", "fr", "es"], default: "en" },
    // ISO 3166-1 alpha-2, used to show local crisis helplines.
    country: { type: String, uppercase: true, maxlength: 2 },
    // GDPR consent records (Art. 7(1): we must be able to show when consent was given).
    consents: {
      terms: { version: String, acceptedAt: Date },
      healthData: { version: String, acceptedAt: Date },
      ageConfirmedAt: Date,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.otp;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const User = mongoose.model("User", userSchema);
