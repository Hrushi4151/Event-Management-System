// seed_database.js
// Run this script to seed the database with sample data
// Usage: node --experimental-modules seed_database.js
// OR: node seed_database.js (if using .mjs extension)
// Make sure MONGODB_URI is set in your .env file

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './src/models/User.js';
import Event from './src/models/Event.js';
import Registration from './src/models/Registration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load sample data
const usersData = JSON.parse(readFileSync(join(__dirname, 'sample_data/users.json'), 'utf8'));
const eventsData = JSON.parse(readFileSync(join(__dirname, 'sample_data/events.json'), 'utf8'));
const registrationsData = JSON.parse(readFileSync(join(__dirname, 'sample_data/registrations.json'), 'utf8'));

async function seedDatabase() {
  try {
    // Connect to MongoDB
    // Use the same connection string from mongoose.js or set MONGODB_URI in .env
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://hrushitech51:eventflow123@cluster0.h5dthvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await Registration.deleteMany({});
    await Event.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Existing data cleared');

    // 1. Insert Users with hashed passwords
    console.log('\n📝 Inserting users...');
    const hashedUsers = await Promise.all(
      usersData.map(async (user) => ({
        ...user,
        password: await bcrypt.hash('password123', 10) // Default password for all users
      }))
    );
    const insertedUsers = await User.insertMany(hashedUsers);
    console.log(`✅ Inserted ${insertedUsers.length} users`);

    // Get user IDs for reference
    const organizers = insertedUsers.filter(u => u.role === 'organizer');
    const attendees = insertedUsers.filter(u => u.role === 'attendee');
    
    console.log(`   - ${organizers.length} organizers`);
    console.log(`   - ${attendees.length} attendees`);

    // 2. Insert Events (assign organizers)
    console.log('\n📅 Inserting events...');
    const eventsWithOrganizers = eventsData.map((event, index) => ({
      ...event,
      organizer: organizers[index % organizers.length]._id
    }));
    const insertedEvents = await Event.insertMany(eventsWithOrganizers);
    console.log(`✅ Inserted ${insertedEvents.length} events`);

    // 3. Insert Registrations (link events and users)
    console.log('\n🎫 Inserting registrations...');
    const registrationsWithIds = registrationsData.map((reg) => {
      // Find matching event by title keywords
      let event;
      if (reg.teamName === 'Code Warriors' || reg.teamName === 'Dev Masters' || reg.teamName === 'Tech Innovators') {
        event = insertedEvents.find(e => e.title.includes('Web Development'));
      } else if (reg.teamName === 'Future Coders') {
        event = insertedEvents.find(e => e.title.includes('Tech Innovation'));
      } else {
        event = insertedEvents.find(e => e.title.includes('Hackathon'));
      }
      
      // Fallback to first event if not found
      if (!event) event = insertedEvents[0];

      // Find matching user by email
      const leader = attendees.find(a => a.email === reg.leader.email);
      
      // Fallback to first attendee if not found
      if (!leader) {
        console.warn(`⚠️  User not found for ${reg.leader.email}, using first attendee`);
      }

      return {
        ...reg,
        event: event._id,
        leader: {
          ...reg.leader,
          userId: leader ? leader._id : attendees[0]._id
        }
      };
    });
    
    const insertedRegistrations = await Registration.insertMany(registrationsWithIds);
    console.log(`✅ Inserted ${insertedRegistrations.length} registrations`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('   Organizers:');
    organizers.forEach(org => {
      console.log(`     - ${org.email} / password123`);
    });
    console.log('   Attendees:');
    attendees.forEach(att => {
      console.log(`     - ${att.email} / password123`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
