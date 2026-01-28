// models/Registration.js
import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  teamName: String,
  leader: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    email: String,
  },
  teamMembers: [
    {
      name: String,
      email: String,
      phone: String,
      profile: String,
      attended: { type: Boolean, default: false }, // Individual attendance tracking
      qrCode: String, // Unique QR code for each team member
      invitationStatus: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
      invitationToken: String,
    },
  ],
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Awaiting Members'], default: 'Pending' },
  checkedIn: { type: Boolean, default: false },
  qrCode: String, // unique code to be scanned
  // Payment fields
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentId: String,
  paymentAmount: Number,
  paymentDate: Date,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Force recompilation if schema changed (Development only workaround)
// In production, this might be overhead, but safe.
if (mongoose.models.Registration) {
  delete mongoose.models.Registration;
}

export default mongoose.models.Registration || mongoose.model('Registration', registrationSchema);
