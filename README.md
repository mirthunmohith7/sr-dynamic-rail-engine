# Southern Railway Dynamic Off-Peak Train Incentive & Seat Recommendation Engine

> **Coursework Prototype — Introduction to Problem Solving (`25ESCS01`)**  
> **Faculty of Engineering and Technology, JAIN (Deemed to be University)**

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS-1572B6?style=flat-square)
![Scope](https://img.shields.io/badge/Network-Southern%20Railway%20(SR)-003366?style=flat-square)
![AI Disclosure](https://img.shields.io/badge/AI%20Assistance-Disclosed%20%26%20Verified-111111?style=flat-square)

---

## Overview

Interstate rail corridors frequently experience **peak-hour waitlists** alongside **off-peak seat vacancies** on the exact same routes. This application models and demonstrates a **Dynamic Off-Peak Train Incentive & Seat Recommendation Engine** (based on the refined **Approach B** logic) for **Southern Railway (`SR`)**, structured with zone and division fields so it can scale across all Indian Railways zones.

---

## Key Features

| Portal | Theme | Capabilities |
| :--- | :--- | :--- |
| **Passenger Portal** (`/index.html`, `/dashboard.html`) | Indian Railways Navy, Blue & Saffron | • Sign in or register a new passenger account<br>• Search Southern Railway (`SR`) trains & corridors<br>• Receive real-time off-peak confirmed seat & fare-discount offers when a peak train is full and fits your flexibility window<br>• Track personal **Total Saved (₹)** and booked e-tickets with PNRs |
| **Hidden Admin Console** (`/admin.html`) | Strict Monochrome Black & White | • Accessed via the standard login form using restricted admin credentials (`admin@sr.rail.gov.in` / `SR_ADMIN_2026`) — no visible admin link on the passenger UI<br>• Tune engine status, seat buffer thresholds, vacancy triggers, and tiered discounts live<br>• Monitor passengers shifted, revenue recovered from empty berths, and unrealized revenue lost |

---

## Project Structure

```text
sr-dynamic-rail-engine/
├── package.json
├── server.js
├── README.md
├── .gitignore
├── data/
│   ├── db.json                 # Auto-generated local store (ignored in Git)
│   └── southern_trains.js      # Scalable Southern Railway (SR) dataset
└── public/
    ├── index.html              # Unified Login & New User Registration
    ├── dashboard.html          # Passenger Booking Portal
    ├── admin.html              # Hidden Admin Control Center
    ├── css/
    │   ├── user.css            # Indian Railways blue/saffron stylesheet
    │   └── admin.css           # Black & white operations stylesheet
    └── js/
        ├── auth.js             # Login, registration & hidden role routing
        ├── user.js             # Route search, off-peak offers & bookings
        └── admin.js            # Mechanism controls & fleet telemetry
```

Quick Start (Local Server)
Install dependencies from the project root (sr-dynamic-rail-engine):

bash
npm install
Windows PowerShell Note: If script execution is blocked (npm.ps1), run npm.cmd install or switch to cmd.
'''
Start the local server:
'''
Bash
npm start
'''
Open in browser:

Plaintext
http://localhost:3000
Demo Credentials
Passenger Account: mirthun@jain.ac.in / password123 (or create any new account via New User Registration)

Hidden Admin Account: admin@sr.rail.gov.in / SR_ADMIN_2026

AI Use Disclosure
AI assistance (Gemini) was used as a collaborative drafting and prototyping aid during coursework development, subject to manual review, verification, and refinement by the author:

Problem Framing & Workbook Structuring: Helped organize observations, five-element checks, comparisons, and drafts into the required workbook formats while keeping final problem statements and boundaries aligned with the coursework problem.

Algorithm & Code Prototyping: Assisted in drafting pseudocode variations, test scenarios, and full-stack Express/HTML/CSS/JS scaffolding for local testing.

Human Verification & Accountability: All logic edge cases (such as symmetric time differences, seat buffers, and invalid capacity guards), UI themes, train corridor entries, and repository submissions were inspected and tested locally. Simulated seat counts, fares, and metrics in this prototype are for educational demonstration rather than official Indian Railways operational data.

Limitations & Future Scaling
Local JSON Persistence: Uses data/db.json for local state instead of a production database (such as PostgreSQL or SQLite).

Simulated Telemetry: Train occupancy, waitlists, and revenue figures are illustrative test data designed for local simulation.

Multi-Zone Expansion: Additional Indian Railways zones and divisions can be added by extending the dataset schema and routing filters.