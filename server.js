const express = require('express');
const fs = require('fs');
const path = require('path');
const SOUTHERN_TRAINS = require('./data/southern_trains');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Hidden Admin Credentials
const ADMIN_EMAIL = 'admin@sr.rail.gov.in';
const ADMIN_PASS = 'SR_ADMIN_2026';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize persistent database if not present
function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      config: {
        engineEnabled: true,
        minBufferSeats: 5,
        tier1VacancyThreshold: 0.40,
        tier1Discount: 0.30,
        tier2VacancyThreshold: 0.20,
        tier2Discount: 0.20,
        tier3Discount: 0.10
      },
      users: [
        {
          id: 'USR-1001',
          name: 'Mirthun Mohith Sathish',
          email: 'mirthun@jain.ac.in',
          password: 'password123',
          totalSaved: 0
        }
      ],
      trains: JSON.parse(JSON.stringify(SOUTHERN_TRAINS)),
      bookings: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

initDB();

// --- AUTH ROUTES ---

// Unified Login (Routes silently to Admin if secret credentials match)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password.' });
  }

  // Hidden Admin Check
  if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASS) {
    return res.json({
      role: 'admin',
      token: 'ADMIN-SESSION-ACTIVE',
      name: 'Southern Railway Operations Control'
    });
  }

  const db = readDB();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. New user? Please register.' });
  }

  return res.json({
    role: 'user',
    user: { id: user.id, name: user.name, email: user.email, totalSaved: user.totalSaved }
  });
});

// New User Registration
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (email.trim().toLowerCase() === ADMIN_EMAIL) {
    return res.status(400).json({ error: 'Reserved system email.' });
  }

  const db = readDB();
  const exists = db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    return res.status(409).json({ error: 'Email already registered. Please sign in.' });
  }

  const newUser = {
    id: 'USR-' + (1000 + db.users.length + 1),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    totalSaved: 0
  };

  db.users.push(newUser);
  writeDB(db);

  return res.json({
    role: 'user',
    user: { id: newUser.id, name: newUser.name, email: newUser.email, totalSaved: 0 }
  });
});

// --- PASSENGER ROUTES ---

// Get Stations & Trains List
app.get('/api/trains', (req, res) => {
  const db = readDB();
  const { origin, destination, zone } = req.query;

  let results = db.trains;
  if (zone && zone !== 'ALL') {
    results = results.filter((t) => t.zone === zone);
  }
  if (origin && destination) {
    results = results.filter((t) => t.origin === origin && t.destination === destination);
  }

  res.json({ trains: results });
});

// Smart Off-Peak Recommendation Check (Approach B Engine - Backend Execution)
app.post('/api/recommend', (req, res) => {
  const { trainNo, flexHours } = req.body;
  const db = readDB();
  const cfg = db.config;

  const reqTrain = db.trains.find((t) => t.trainNo === trainNo);
  if (!reqTrain) return res.status(404).json({ error: 'Train not found' });

  const isPeakFull = reqTrain.booked >= reqTrain.totalCap;
  const flex = Number(flexHours) || 0;

  if (!cfg.engineEnabled || !isPeakFull || flex <= 0) {
    return res.json({ hasRecommendation: false });
  }

  // Find parallel off-peak trains on the same corridor within user's flexibility window
  const candidates = db.trains.filter((t) => {
    if (t.trainNo === reqTrain.trainNo) return false;
    if (t.origin !== reqTrain.origin || t.destination !== reqTrain.destination) return false;
    const vacant = t.totalCap - t.booked;
    const timeDiff = Math.abs(t.depHour - reqTrain.depHour);
    return vacant > cfg.minBufferSeats && timeDiff <= flex;
  });

  if (candidates.length === 0) {
    return res.json({ hasRecommendation: false });
  }

  // Pick candidate with highest vacancy ratio
  candidates.sort((a, b) => (b.totalCap - b.booked) / b.totalCap - (a.totalCap - a.booked) / a.totalCap);
  const bestAlt = candidates[0];
  const altVacant = bestAlt.totalCap - bestAlt.booked;
  const vacancyRatio = altVacant / bestAlt.totalCap;

  let discountRate = cfg.tier3Discount;
  if (vacancyRatio >= cfg.tier1VacancyThreshold) {
    discountRate = cfg.tier1Discount;
  } else if (vacancyRatio >= cfg.tier2VacancyThreshold) {
    discountRate = cfg.tier2Discount;
  }

  const discountedFare = Math.round(bestAlt.baseFare * (1 - discountRate));
  const amountSaved = bestAlt.baseFare - discountedFare;

  return res.json({
    hasRecommendation: true,
    peakTrain: reqTrain,
    recommendedTrain: bestAlt,
    availableSeats: altVacant,
    discountPercent: Math.round(discountRate * 100),
    originalFare: bestAlt.baseFare,
    discountedFare,
    amountSaved
  });
});

// Book Ticket (Standard or Shifted Off-Peak)
app.post('/api/book', (req, res) => {
  const { userId, trainNo, passengerName, age, shiftedFromTrainNo, discountApplied, amountSaved } = req.body;
  const db = readDB();

  const user = db.users.find((u) => u.id === userId);
  const train = db.trains.find((t) => t.trainNo === trainNo);

  if (!user || !train) {
    return res.status(404).json({ error: 'User or train record invalid.' });
  }

  let status = 'CONFIRMED';
  let farePaid = train.baseFare;
  let saved = 0;

  if (shiftedFromTrainNo && amountSaved > 0) {
    // Shifted off-peak booking
    if (train.booked >= train.totalCap) {
      return res.status(400).json({ error: 'Off-peak seats just filled up.' });
    }
    train.booked += 1;
    farePaid = train.baseFare - Number(amountSaved);
    saved = Number(amountSaved);
    user.totalSaved += saved;

    // Relieve 1 waitlist slot from the congested peak train
    const peakTrain = db.trains.find((t) => t.trainNo === shiftedFromTrainNo);
    if (peakTrain && peakTrain.waitlist > 0) {
      peakTrain.waitlist -= 1;
    }
  } else {
    // Normal booking
    if (train.booked < train.totalCap) {
      train.booked += 1;
      status = 'CONFIRMED';
    } else {
      train.waitlist += 1;
      status = `WL-${train.waitlist}`;
    }
  }

  const pnr = '4' + Math.floor(100000000 + Math.random() * 900000000);
  const bookingRecord = {
    pnr,
    userId: user.id,
    passengerName: passengerName || user.name,
    age: age || 22,
    trainNo: train.trainNo,
    trainName: train.name,
    origin: train.originName,
    destination: train.destinationName,
    depTime: train.depTime,
    status,
    farePaid,
    amountSaved: saved,
    isShifted: Boolean(shiftedFromTrainNo),
    shiftedFromTrainNo: shiftedFromTrainNo || null,
    bookedAt: new Date().toLocaleString('en-IN')
  };

  db.bookings.unshift(bookingRecord);
  writeDB(db);

  res.json({
    booking: bookingRecord,
    totalSaved: user.totalSaved
  });
});

// Get User Bookings & Savings
app.get('/api/user/:userId/summary', (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userBookings = db.bookings.filter((b) => b.userId === user.id);
  res.json({
    user: { id: user.id, name: user.name, email: user.email, totalSaved: user.totalSaved },
    bookings: userBookings
  });
});

// --- ADMIN ROUTES ---

app.get('/api/admin/overview', (req, res) => {
  const db = readDB();

  const shiftedBookings = db.bookings.filter((b) => b.isShifted);
  const totalShifted = shiftedBookings.length;

  // Revenue recovered from empty off-peak seats filled by shifted passengers
  const revenueRecovered = shiftedBookings.reduce((sum, b) => sum + b.farePaid, 0);

  // Unrealized revenue lost on remaining empty off-peak seats across Southern Railway
  let unutilizedSeats = 0;
  let revenueLost = 0;
  db.trains.forEach((t) => {
    const empty = t.totalCap - t.booked;
    if (empty > 0) {
      unutilizedSeats += empty;
      revenueLost += empty * t.baseFare;
    }
  });

  res.json({
    config: db.config,
    metrics: {
      totalShifted,
      revenueRecovered,
      revenueLost,
      unutilizedSeats,
      totalBookings: db.bookings.length
    },
    trains: db.trains,
    recentBookings: db.bookings.slice(0, 15)
  });
});

// Update Mechanism Parameters
app.post('/api/admin/config', (req, res) => {
  const db = readDB();
  const {
    engineEnabled,
    minBufferSeats,
    tier1VacancyThreshold,
    tier1Discount,
    tier2VacancyThreshold,
    tier2Discount,
    tier3Discount
  } = req.body;

  db.config = {
    engineEnabled: Boolean(engineEnabled),
    minBufferSeats: Number(minBufferSeats),
    tier1VacancyThreshold: Number(tier1VacancyThreshold),
    tier1Discount: Number(tier1Discount),
    tier2VacancyThreshold: Number(tier2VacancyThreshold),
    tier2Discount: Number(tier2Discount),
    tier3Discount: Number(tier3Discount)
  };

  writeDB(db);
  res.json({ success: true, config: db.config });
});

// Reset Simulation Data
app.post('/api/admin/reset', (req, res) => {
  const db = readDB();
  db.trains = JSON.parse(JSON.stringify(SOUTHERN_TRAINS));
  db.bookings = [];
  db.users.forEach((u) => (u.totalSaved = 0));
  writeDB(db);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Southern Railway Smart Ticketing Server running at http://localhost:${PORT}`);
});