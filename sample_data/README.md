# Sample Data for Event Management App

This directory contains sample JSON data for seeding the database with test data.

## Important Notes

### 1. User Passwords
The passwords in `users.json` are placeholder hashed values. **You MUST hash the actual passwords before inserting.**

**Default password for all users: `password123`**

To hash passwords properly, use bcrypt with salt rounds of 10:
```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash('password123', 10);
```

### 2. ObjectId References
When inserting data:
- **Events**: Replace `organizer` field with actual User ObjectId (from organizers - users with role "organizer")
- **Registrations**: Replace `event` and `leader.userId` fields with actual ObjectIds:
  - `event`: Event ObjectId
  - `leader.userId`: User ObjectId (from attendees - users with role "attendee")

### 3. Insertion Order
Insert data in this order:
1. **Users** first (organizers and attendees)
2. **Events** second (need organizer ObjectIds)
3. **Registrations** last (need both Event and User ObjectIds)

## Sample Insertion Script

Here's a Node.js script to insert the data:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const usersData = require('./sample_data/users.json');
const eventsData = require('./sample_data/events.json');
const registrationsData = require('./sample_data/registrations.json');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // 1. Insert Users
    console.log('Inserting users...');
    const hashedUsers = await Promise.all(
      usersData.map(async (user) => ({
        ...user,
        password: await bcrypt.hash('password123', 10)
      }))
    );
    const insertedUsers = await User.insertMany(hashedUsers);
    console.log(`Inserted ${insertedUsers.length} users`);

    // Get user IDs for reference
    const organizers = insertedUsers.filter(u => u.role === 'organizer');
    const attendees = insertedUsers.filter(u => u.role === 'attendee');

    // 2. Insert Events (assign organizers)
    console.log('Inserting events...');
    const eventsWithOrganizers = eventsData.map((event, index) => ({
      ...event,
      organizer: organizers[index % organizers.length]._id
    }));
    const insertedEvents = await Event.insertMany(eventsWithOrganizers);
    console.log(`Inserted ${insertedEvents.length} events`);

    // 3. Insert Registrations (link events and users)
    console.log('Inserting registrations...');
    const registrationsWithIds = registrationsData.map((reg, index) => {
      // Find matching event by title or use first event
      const event = insertedEvents.find(e => 
        e.title.includes('Web Development') || 
        e.title.includes('Tech Innovation') ||
        e.title.includes('Hackathon')
      ) || insertedEvents[0];

      // Find matching user by email or use first attendee
      const leader = attendees.find(a => 
        a.email === reg.leader.email
      ) || attendees[0];

      return {
        ...reg,
        event: event._id,
        leader: {
          ...reg.leader,
          userId: leader._id
        }
      };
    });
    const insertedRegistrations = await Registration.insertMany(registrationsWithIds);
    console.log(`Inserted ${insertedRegistrations.length} registrations`);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
```

## Manual Insertion via MongoDB

If you prefer to insert manually:

1. **Users**: Use MongoDB Compass or mongo shell
   - Remember to hash passwords first
   - Default password: `password123`

2. **Events**: 
   - Replace `organizer` with actual User ObjectId
   - Example: `"organizer": ObjectId("507f1f77bcf86cd799439011")`

3. **Registrations**:
   - Replace `event` with Event ObjectId
   - Replace `leader.userId` with User ObjectId
   - Example: 
     ```json
     {
       "event": ObjectId("507f1f77bcf86cd799439012"),
       "leader": {
         "userId": ObjectId("507f1f77bcf86cd799439013"),
         "name": "Michael Chen",
         "email": "michael.chen@example.com"
       }
     }
     ```

## Test Credentials

After insertion, you can login with:
- **Organizers:**
  - Email: `john.smith@example.com` / Password: `password123`
  - Email: `sarah.johnson@example.com` / Password: `password123`

- **Attendees:**
  - Email: `michael.chen@example.com` / Password: `password123`
  - Email: `emily.davis@example.com` / Password: `password123`
  - Email: `david.wilson@example.com` / Password: `password123`
