// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  password: { type: String, required: false }, // hashed (optional for OAuth users)
  role: { type: String, enum: ['organizer', 'attendee'], required: false }, // Will be set during onboarding
  organization: String, // for organizers
  college: String,      // for attendees (optional)
  bio: String,
  avatar: String,
  // Password reset fields
  resetOTP: String,
  resetOTPExpiry: Date,
  resetOTPAttempts: { type: Number, default: 0 },
  resetToken: String,
  resetTokenExpiry: Date,
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);
