// models/Event.js
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  location: String,
  mode: { type: String, enum: ['Online', 'Offline'], default: 'Offline' },
  status: { type: String, enum: ['Upcoming', 'Completed','Cancelled','Active'], default: 'Upcoming' },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  registrationStartDate: String, // When registration opens
  registrationEndDate: String, // When registration closes
  actualEventDate: String, // Main event date (for single-day events or primary date)
  bannerImage: String,
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  capacity: Number,
  coordinates: {
    lat: Number,
    lng: Number
  }, // Map coordinates for location
  // Payment fields
  isFree: { type: Boolean, default: true },
  registrationFee: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  // Completed event features
  winners: [{
    position: { type: String, required: true }, // e.g., "1st Place", "2nd Place", "3rd Place"
    teamName: String,
    leaderName: String,
    leaderEmail: String,
    prize: String, // Optional prize description
  }],
  eventPhotos: [String], // Array of image URLs/base64
  highlights: String, // Text summary of event highlights
  summary: String, // Detailed event summary
  testimonials: [{
    name: String,
    role: String, // e.g., "Participant", "Organizer", "Judge"
    text: String,
    rating: { type: Number, min: 1, max: 5 }, // Optional rating
  }],
  statistics: {
    totalParticipants: Number,
    totalTeams: Number,
    totalAttendees: Number,
    averageRating: Number,
  },
  createdAt: { type: Date, default: Date.now },
  cancelledAt: { type: Date }, // Track when event was cancelled (soft delete)
}, { timestamps: true });

// Force refresh model in development to pick up schema changes
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Event;
}

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
export default Event;
