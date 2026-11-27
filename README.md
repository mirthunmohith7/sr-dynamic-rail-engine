# Southern Railway Dynamic Off-Peak Train Incentive & Seat Recommendation Engine

A full-stack prototype built for **Introduction to Problem Solving (25ESCS01)** at **JAIN (Deemed to be University)** (Faculty of Engineering and Technology, B.Tech CSE). It addresses peak-hour train waitlists occurring alongside off-peak seat vacancies on interstate corridors by nudging time-flexible passengers toward underutilized off-peak departures with instant confirmed seating and tiered fare discounts.

## Key Features

- **Passenger Portal (Indian Railways Theme):**
  - Unified sign-in and new passenger registration (`/index.html`, `/dashboard.html`).
  - Route search across Southern Railway (`SR`) corridors (Chennai, Bengaluru, Erode, Coimbatore, Madurai, Ernakulam, Thiruvananthapuram, Mangaluru) with a scalable zone/division schema ready to expand across all Indian Railways zones.
  - Real-time off-peak alternative prompts when a requested peak train is full and an underutilized off-peak train falls within the passenger's flexibility window.
  - Personal tracking for **Total Saved (₹)** and booked e-tickets with PNRs.
- **Hidden Admin Operations Console (Monochrome Black & White Theme):**
  - Accessible by signing in on the standard login form using restricted admin credentials (`admin@sr.rail.gov.in` / `SR_ADMIN_2026`).
  - Live mechanism parameter controls (engine toggle, minimum off-peak buffer seats, vacancy thresholds, and tiered discounts).
  - Real-time metrics tracking passengers shifted from peak to off-peak, revenue recovered from empty berths, and unrealized revenue lost on remaining empty seats.

## Project Structure

```text
sr-dynamic-rail-engine/
├── package.json
├── server.js
├── README.md
├── data/
│   ├── db.json                 # Auto-generated persistent store (users, bookings, config)
│   └── southern_trains.js      # Southern Railway (SR) train & corridor dataset
└── public/
    ├── index.html              # Unified Login & New User Registration
    ├── dashboard.html          # Passenger Booking Portal
    ├── admin.html              # Hidden Admin Control Center
    ├── css/
    │   ├── user.css            # Indian Railways blue/saffron theme
    │   └── admin.css           # Black & white operations theme
    └── js/
        ├── auth.js             # Authentication, registration & role routing
        ├── user.js             # Train search, off-peak offers & ticket booking
        └── admin.js            # Admin telemetry & parameter controls