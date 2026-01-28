# How to Insert Sample Data into Database

## Quick Method: Using MongoDB Compass or MongoDB Shell

### Step 1: Insert Users

**Important:** Passwords must be hashed using bcrypt before insertion. The default password for all users is: `password123`

You can use this Node.js snippet to hash passwords:

```javascript
const bcrypt = require('bcryptjs');
const hashed = await bcrypt.hash('password123', 10);
console.log(hashed);
```

Or use the seed script provided.

### Step 2: Insert Events

After inserting users, note the ObjectIds of the organizers (users with role "organizer"), then update the `organizer` field in events.json with those ObjectIds.

### Step 3: Insert Registrations

After inserting events, note the Event ObjectIds and User ObjectIds, then update:
- `event` field with Event ObjectId
- `leader.userId` field with User ObjectId (attendee)

## Method 1: Using the Seed Script

1. Make sure you have Node.js installed
2. Navigate to the project root: `cd eventflow`
3. Run: `node seed_database.js`

The script will:
- Hash all passwords automatically
- Link events to organizers
- Link registrations to events and users
- Clear existing data (optional - can be disabled)

## Method 2: Manual Insertion via MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. For each collection (users, events, registrations):
   - Click "Insert Document"
   - Paste the JSON from the respective file
   - **Important:** For users, hash passwords first
   - **Important:** For events, replace `organizer` with actual ObjectId
   - **Important:** For registrations, replace `event` and `leader.userId` with actual ObjectIds

## Method 3: Using MongoDB Shell (mongosh)

```javascript
// 1. Insert Users (with hashed passwords)
use eventflow;
db.users.insertMany([
  // Paste users.json content here, but replace password with hashed version
]);

// 2. Insert Events (replace organizer with ObjectId)
db.events.insertMany([
  // Paste events.json content here, replace organizer field
]);

// 3. Insert Registrations (replace event and leader.userId with ObjectIds)
db.registrations.insertMany([
  // Paste registrations.json content here, replace ObjectId references
]);
```

## Test Login Credentials

After insertion, you can login with any of these accounts:

**Organizers:**
- Email: `john.smith@example.com` / Password: `password123`
- Email: `sarah.johnson@example.com` / Password: `password123`

**Attendees:**
- Email: `michael.chen@example.com` / Password: `password123`
- Email: `emily.davis@example.com` / Password: `password123`
- Email: `david.wilson@example.com` / Password: `password123`
