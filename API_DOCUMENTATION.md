# EventFlow API Documentation

## Events API

### GET /api/events
Fetch all events
- **Response**: Array of events sorted by creation date (newest first)
- **Example Response**:
```json
[
  {
    "_id": "event_id",
    "title": "Tech Symposium 2024",
    "description": "Annual technology conference",
    "location": "City Hall, NY",
    "mode": "Offline",
    "startDate": "2024-07-15",
    "endDate": "2024-07-16",
    "bannerImage": "image_url",
    "capacity": 100,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /api/events
Create a new event
- **Required Fields**: `title`, `startDate`, `endDate`
- **Optional Fields**: `description`, `location`, `mode`, `bannerImage`, `capacity`
- **Request Body**:
```json
{
  "title": "Tech Symposium 2024",
  "description": "Annual technology conference",
  "location": "City Hall, NY",
  "mode": "Offline",
  "startDate": "2024-07-15",
  "endDate": "2024-07-16",
  "bannerImage": "image_url",
  "capacity": 100
}
```
- **Response**: Created event object
- **Error Codes**: 
  - `400`: Missing required fields
  - `409`: Event with same title already exists
  - `500`: Server error

### GET /api/events/[id]
Fetch a specific event
- **Response**: Event object
- **Error Codes**: 
  - `404`: Event not found
  - `500`: Server error

### PUT /api/events/[id]
Update an event
- **Request Body**: Event fields to update
- **Response**: Updated event object
- **Error Codes**: 
  - `404`: Event not found
  - `500`: Server error

### DELETE /api/events/[id]
Delete an event
- **Response**: Success message
- **Error Codes**: 
  - `404`: Event not found
  - `500`: Server error

## Registration API

### GET /api/registration
Fetch all registrations (for organizers)
- **Response**: Array of registrations with populated event and user data
- **Example Response**:
```json
[
  {
    "_id": "registration_id",
    "event": {
      "_id": "event_id",
      "title": "Tech Symposium 2024",
      "startDate": "2024-07-15",
      "endDate": "2024-07-16"
    },
    "teamName": "Team Alpha",
    "leader": {
      "userId": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "name": "John Doe",
      "email": "john@example.com"
    },
    "teamMembers": [
      {
        "name": "Jane Smith",
        "email": "jane@example.com",
        "profile": "Developer"
      }
    ],
    "status": "Pending",
    "checkedIn": false,
    "qrCode": "EVENT_event_id_USER_user_id_timestamp",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /api/registration
Register for an event
- **Required Fields**: `event`, `leader.userId`, `leader.name`, `leader.email`
- **Optional Fields**: `teamName`, `teamMembers`
- **Request Body**:
```json
{
  "event": "event_id",
  "teamName": "Team Alpha",
  "leader": {
    "userId": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "teamMembers": [
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "profile": "Developer"
    }
  ]
}
```
- **Response**: Created registration object
- **Error Codes**: 
  - `400`: Missing required fields
  - `409`: User already registered for this event
  - `500`: Server error

### GET /api/registration/[eventId]
Fetch registrations for a specific event
- **Response**: Array of registrations for the specified event
- **Error Codes**: 
  - `500`: Server error

### GET /api/registration/user/[userId]
Fetch registrations for a specific user
- **Response**: Array of user's registrations
- **Error Codes**: 
  - `500`: Server error

### PUT /api/registration/[registrationId]
Update registration status or check-in status
- **Allowed Updates**: `status`, `checkedIn`
- **Request Body**:
```json
{
  "status": "Accepted",
  "checkedIn": true
}
```
- **Response**: Updated registration object
- **Error Codes**: 
  - `400`: No valid fields to update
  - `404`: Registration not found
  - `500`: Server error

### DELETE /api/registration/[registrationId]
Cancel a registration
- **Response**: Success message
- **Error Codes**: 
  - `404`: Registration not found
  - `500`: Server error

## Authentication API

### POST /api/auth/signup
Register a new user
- **Required Fields**: `name`, `email`, `password`, `role`
- **Request Body**:
```json
{
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "attendee"
  }
}
```
- **Response**: Success message with user ID
- **Error Codes**: 
  - `409`: Email already registered
  - `500`: Server error

### POST /api/auth/login
Login user (handled by NextAuth)
- **Request Body**: `email`, `password`
- **Response**: Authentication session
- **Error Codes**: 
  - `401`: Invalid credentials
  - `500`: Server error

## Usage Examples

### Creating an Event
```javascript
const response = await fetch('/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Tech Symposium 2024',
    description: 'Annual technology conference',
    location: 'City Hall, NY',
    mode: 'Offline',
    startDate: '2024-07-15',
    endDate: '2024-07-16',
    capacity: 100
  })
});
```

### Registering for an Event
```javascript
const response = await fetch('/api/registration', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    event: 'event_id',
    teamName: 'Team Alpha',
    leader: {
      userId: 'user_id',
      name: 'John Doe',
      email: 'john@example.com'
    },
    teamMembers: [
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        profile: 'Developer'
      }
    ]
  })
});
```

### Fetching User's Registrations
```javascript
const response = await fetch('/api/registration/user/user_id');
const registrations = await response.json();
```

### Updating Registration Status
```javascript
const response = await fetch('/api/registration/registration_id', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'Accepted',
    checkedIn: true
  })
});
``` 