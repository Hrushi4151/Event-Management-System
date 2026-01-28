import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Create TTL index to automatically delete documents after expiresAt
verificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Verification || mongoose.model('Verification', verificationSchema);
