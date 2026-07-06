# 🎉 EventFlow — Event Management Platform

A full-stack event management web application built with **Next.js 15**, supporting event creation, team-based registration, QR code ticketing, payment processing, and rich dashboards for both attendees and organizers.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Models](#database-models)
- [API Routes](#api-routes)
- [Pages & Routes](#pages--routes)
- [User Roles & Flows](#user-roles--flows)
- [Authentication](#authentication)
- [Payment Integration](#payment-integration)
- [Team Invitations](#team-invitations)
- [QR Code System](#qr-code-system)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)

---

## Overview

EventFlow is a complete event management solution designed for **colleges, clubs, and startups**. It allows organizers to create and manage events while attendees can register individually or as teams, receive QR-code tickets, and track attendance — all from a clean, modern dashboard.

---

## Features

### 🧍 For Attendees
- Browse and register for events (individual or team)
- Team-based registration with automatic email/SMS invitations to members
- Receive and manage QR code tickets
- Accept/decline team invitations from dashboard
- Track upcoming, attended, and past events
- View personal attendance rate with charts
- Profile management with avatar, bio, and stats
- Password reset via OTP email

### 🧑‍💼 For Organizers
- Create and publish events (online/offline, free/paid)
- Set registration windows (open & close dates)
- Manage registrations — approve, reject, or view details
- Scan attendee QR codes for check-in (camera-based scanner)
- View event analytics — attendance rates, participant stats
- Add post-event features: winners, photos, highlights, testimonials
- View full organizer dashboard with stats and event calendar

### 🔐 Authentication & Onboarding
- Email/password login with bcrypt hashing
- Google OAuth (sign in with Google)
- Role selection during onboarding (Attendee / Organizer)
- Password setup for OAuth users
- Route protection via Next.js middleware

### 💳 Payments
- Razorpay payment gateway integration for paid events
- Stripe payment support (configured, test mode)
- Payment status tracking: pending / completed / failed / refunded

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15.3 (App Router, Turbopack) |
| **Frontend** | React 19, Tailwind CSS v4 |
| **Authentication** | NextAuth.js v4 (Credentials + Google OAuth) |
| **Database** | MongoDB Atlas + Mongoose 8 |
| **State Management** | Redux Toolkit + React Redux |
| **Charts** | Chart.js, React Chart.js 2, Recharts |
| **Maps** | Leaflet, React Leaflet, Leaflet Routing Machine |
| **Calendar** | FullCalendar (Day Grid, Time Grid, Interaction) |
| **QR Codes** | qrcode.react (generate), html5-qrcode (scan) |
| **Payments** | Razorpay, Stripe |
| **Notifications** | notificationapi-node-server-sdk (email + SMS) |
| **Animations** | Framer Motion |
| **Encryption** | bcryptjs, crypto-js |
| **Icons** | React Icons v5 |
| **Progress** | react-circular-progressbar |

---

## Project Structure

```
eventflow/
├── src/
│   ├── app/
│   │   ├── (newuser)/              # Public-facing pages (no auth required)
│   │   │   ├── page.js             # Landing / Home page
│   │   │   ├── layout.js           # Public layout with Navbar
│   │   │   ├── Navbar.js           # Public navigation bar
│   │   │   ├── login/              # Login page
│   │   │   ├── register/           # Registration page
│   │   │   ├── about/              # About page
│   │   │   ├── contact/            # Contact page
│   │   │   └── accept-invite/      # Public invite acceptance (fallback)
│   │   │
│   │   ├── dashboard/              # Protected dashboard (auth required)
│   │   │   ├── page.js             # Dashboard home (role-based redirect)
│   │   │   ├── layout.js           # Dashboard layout with sidebar
│   │   │   ├── events/             # Events list & event detail
│   │   │   ├── tickets/            # My Tickets page (QR codes)
│   │   │   ├── invitations/        # Pending invitations + [token] detail
│   │   │   ├── profile/            # User profile page
│   │   │   ├── create-event/       # Organizer: Create new event
│   │   │   ├── analytics/          # Organizer: Analytics dashboard
│   │   │   ├── qrscanner/          # Organizer: QR code scanner
│   │   │   ├── onboarding/         # Role selection onboarding
│   │   │   ├── select-role/        # Role switching
│   │   │   └── set-password/       # Password setup for OAuth users
│   │   │
│   │   ├── api/                    # API Routes (Next.js App Router)
│   │   │   ├── auth/[...nextauth]/ # NextAuth configuration
│   │   │   ├── events/             # Event CRUD
│   │   │   ├── registration/       # Registration CRUD + accept-invite
│   │   │   ├── user/               # User profile + invitations
│   │   │   ├── users/              # Admin user listing
│   │   │   ├── signup/             # User registration
│   │   │   ├── organizer/          # Organizer stats
│   │   │   ├── eventstats/         # Event statistics
│   │   │   ├── getallorganizerstat/# Platform-wide stats
│   │   │   └── payment/            # Razorpay/Stripe payment APIs
│   │   │       ├── order/          # Create payment order
│   │   │       └── verify/         # Verify payment
│   │   │
│   │   ├── components/             # Shared components
│   │   │   └── ContextProvider.js  # Organizer context
│   │   │
│   │   ├── ReduxReducers/          # Redux state slices
│   │   ├── globals.css             # Global styles
│   │   └── middleware.js           # Route protection middleware
│   │
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Registration.js
│   │   └── Verification.js
│   │
│   └── utils/
│       └── mongoose.js             # MongoDB connection utility
│
├── scripts/
│   └── patch-localstorage.js       # Dev server patch
├── sample_data/                    # Sample seed data
├── seed_database.js                # Database seeder script
├── .env.local                      # Environment variables
└── package.json
```

---

## Database Models

### `User`
```
name, email, phone, password (hashed), role (attendee|organizer),
organization, college, bio, avatar,
resetOTP, resetOTPExpiry, resetOTPAttempts, resetToken, resetTokenExpiry
```

### `Event`
```
title, description, location, mode (Online|Offline),
status (Upcoming|Active|Completed|Cancelled),
startDate, endDate, registrationStartDate, registrationEndDate,
bannerImage, organizer (ref: User), capacity,
coordinates { lat, lng },
isFree, registrationFee, currency,
winners [{ position, teamName, leaderName, leaderEmail, prize }],
eventPhotos [], highlights, summary,
testimonials [{ name, role, text, rating }],
statistics { totalParticipants, totalTeams, totalAttendees, averageRating },
cancelledAt
```

### `Registration`
```
event (ref: Event), teamName,
leader { userId (ref: User), name, email },
teamMembers [{
  name, email, phone, profile,
  attended (bool),
  qrCode (string),
  invitationStatus (Pending|Accepted|Rejected),
  invitationToken (string)
}],
status (Pending|Accepted|Rejected|Awaiting Members),
checkedIn (bool),
qrCode (string),
paymentStatus (pending|completed|failed|refunded),
paymentId, paymentAmount, paymentDate
```

### `Verification`
Used for OTP-based password reset verification.

---

## API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| ALL | `/api/auth/[...nextauth]` | NextAuth handlers (login, Google OAuth) |
| POST | `/api/signup` | Create new user account |

### Events
| Method | Route | Description |
|---|---|---|
| GET | `/api/events` | List all events |
| POST | `/api/events` | Create a new event |
| GET | `/api/events/[id]` | Get single event details |
| PUT | `/api/events/[id]` | Update event |
| DELETE | `/api/events/[id]` | Delete event |

### Registrations
| Method | Route | Description |
|---|---|---|
| GET | `/api/registration` | Get all registrations (organizer) |
| POST | `/api/registration` | Register for an event + send invites |
| GET | `/api/registration/[registrationId]` | Get single registration |
| PUT | `/api/registration/[registrationId]` | Update registration (approve/reject) |
| POST | `/api/registration/accept-invite` | Accept a team invitation by token |
| GET | `/api/registration/user/[userId]` | Get registrations for a user (leader or accepted member) |
| GET | `/api/registration/qrcode/[code]` | Lookup registration by QR code |

### Users & Profile
| Method | Route | Description |
|---|---|---|
| GET | `/api/user/[userId]` | Get user profile |
| PUT | `/api/user/[userId]` | Update user profile |
| GET | `/api/user/invitations` | Get pending team invitations for logged-in user |

### Stats & Analytics
| Method | Route | Description |
|---|---|---|
| GET | `/api/organizer/[id]` | Get organizer's events and stats |
| GET | `/api/eventstats` | Get stats for a specific event |
| GET | `/api/getallorganizerstat` | Platform-wide organizer statistics |

### Payments
| Method | Route | Description |
|---|---|---|
| POST | `/api/payment/order` | Create Razorpay payment order |
| POST | `/api/payment/verify` | Verify payment and update registration |

---

## Pages & Routes

### Public Pages (`/`)
| Route | Description |
|---|---|
| `/` | Landing page with features, how it works, testimonials |
| `/login` | Login (email/password or Google) |
| `/register` | Sign up form |
| `/about` | About page |
| `/contact` | Contact page |

### Dashboard Pages (`/dashboard`) — Auth Required
| Route | Role | Description |
|---|---|---|
| `/dashboard` | Both | Home — redirects to role-specific dashboard |
| `/dashboard/events` | Both | Events list |
| `/dashboard/events/[id]` | Both | Event detail page |
| `/dashboard/tickets` | Attendee | My tickets with QR codes |
| `/dashboard/invitations` | Attendee | Pending team invitations |
| `/dashboard/invitations/[token]` | Attendee | Accept/decline a specific invitation |
| `/dashboard/profile` | Both | User profile & stats |
| `/dashboard/create-event` | Organizer | Create new event form |
| `/dashboard/analytics` | Organizer | Analytics & reports |
| `/dashboard/qrscanner` | Organizer | Camera-based QR check-in |
| `/dashboard/onboarding` | Both | Role selection after signup |
| `/dashboard/set-password` | OAuth users | Set password for OAuth accounts |

---

## User Roles & Flows

### Attendee Flow
```
Sign Up → Select Role (Attendee) → Browse Events →
Register (Solo or Team) → Get QR Ticket →
[If Team] Accept Invitations from team members →
Attend Event → QR Scanned → Ticket marked Attended
```

### Organizer Flow
```
Sign Up → Select Role (Organizer) → Create Event →
Set Registration Window → Manage Registrations (Approve/Reject) →
Scan QR Codes on Event Day → View Attendance Stats →
Post-Event: Add winners, photos, highlights
```

---

## Authentication

- **Email/Password**: Bcrypt-hashed passwords stored in MongoDB. Login validates hash.
- **Google OAuth**: Creates or links user account on first login. Role is set during onboarding.
- **JWT Sessions**: NextAuth JWT strategy. Token enriched with `id`, `role`, `name`, `email`, `image`.
- **Middleware Protection**: `/dashboard`, `/profile`, `/tickets`, etc. require a valid session token. Logged-in users are redirected away from `/login` and `/register`.
- **Password Reset**: OTP sent via email, stored temporarily with expiry. Verified before allowing password change.

---

## Payment Integration

### Razorpay (Primary)
- Paid events have `isFree: false` and a `registrationFee` set by the organizer.
- On registration, a Razorpay order is created via `/api/payment/order`.
- After payment, `/api/payment/verify` validates the signature and updates the registration's `paymentStatus` to `completed`.

### Stripe (Configured)
- Stripe keys are configured in `.env.local`.
- Integration ready for future use or as an alternative gateway.

---

## Team Invitations

When registering as a **team**:

1. **Leader** fills in team name and lists team members (name, email, optional phone).
2. **API** generates a unique crypto token for each member.
3. **Email notification** is sent to each member via NotificationAPI with an accept link.
4. **SMS** is also sent if a phone number is provided.
5. Registration status is set to **`Awaiting Members`** until all members accept.
6. Each member visits `/dashboard/invitations/[token]` to **accept or decline**.
7. Once all members accept, status updates to **`Pending`** (awaiting organizer approval).
8. Accepted members see the event in their **Tickets** and **Events** pages with their own QR code and attendance status.

---

## QR Code System

- Each registration gets a **unique QR code string** for the leader.
- Each team member also gets their own **individual QR code**.
- QR codes are displayed on the **Tickets page** using `qrcode.react`.
- Organizers use the **QR Scanner** (`html5-qrcode`) to scan codes at entry.
- Scanning resolves the registration and marks `checkedIn: true` (leader) or `member.attended: true` (team member).
- Attendance stats on the profile and dashboard reflect individual check-in status.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Razorpay (add if using)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret

# NotificationAPI (for team invitations & email/SMS)
NOTIFICATION_API_APP_ID=your_app_id
NOTIFICATION_API_SECRET=your_secret
```

> ⚠️ **Never commit `.env.local` to version control.** Add it to `.gitignore`.

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- (Optional) Google Cloud Console project for OAuth
- (Optional) Razorpay / Stripe account for payments
- (Optional) NotificationAPI account for email/SMS

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd eventflow

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### Seed the Database (Optional)

```bash
node seed_database.js
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

---

## Dashboard Components

### Attendee Dashboard
- **Stats Cards**: Tickets booked, events attended, upcoming events, expired/cancelled, pending
- **Bar Chart**: Monthly participation timeline (last 6 months)
- **Circular Progress**: Attendance rate percentage
- **Doughnut Chart**: Event type distribution (Online vs Offline)
- **Quick Actions**: Browse Events, My Tickets, View Profile

### Organizer Dashboard
- **Stats Cards**: Total events, total registrations, total attendees, pending approvals
- **Event Calendar**: FullCalendar view of all events
- **Registration List**: Manage and approve/reject registrations
- **Analytics Page**: Attendance rates, revenue, event comparisons

---

## Key Libraries Reference

| Library | Purpose |
|---|---|
| `next-auth` | Authentication (Credentials + Google OAuth) |
| `mongoose` | MongoDB ODM and schema management |
| `bcryptjs` | Password hashing |
| `crypto` | Secure token generation for invitations |
| `qrcode.react` | QR code display in tickets |
| `html5-qrcode` | Camera-based QR code scanning |
| `@fullcalendar/react` | Event calendar in organizer dashboard |
| `react-leaflet` | Interactive maps for event locations |
| `chart.js` / `recharts` | Analytics charts and graphs |
| `react-circular-progressbar` | Attendance rate display |
| `framer-motion` | Page and component animations |
| `@reduxjs/toolkit` | Global state management |
| `notificationapi-node-server-sdk` | Email and SMS notifications |
| `razorpay` | Payment order creation and verification |

---

## License

This project is for educational and demonstration purposes.
