let currentUser = JSON.parse(sessionStorage.getItem('sr_user'));
if (!currentUser) {
  window.location.href = '/index.html';
}

let activeBookingContext = {
  targetTrain: null,
  shiftedFromTrainNo: null,
  amountSaved: 0,
  payableFare: 0
};

document.getElementById('nav-username').textContent = currentUser.name;
document.getElementById('nav-saved').textContent = `₹${currentUser.totalSaved || 0}`;

function logout() {
  sessionStorage.removeItem('sr_user');
  window.location.href = '/index.html';
}

async function loadTrains() {
  const origin = document.getElementById('origin-select').value;
  const destination = document.getElementById('dest-select').value;
  const zone = document.getElementById('zone-select').value;

  const params = new URLSearchParams({ origin, destination, zone });
  const res = await fetch(`/api/trains?${params.toString()}`);
  const data = await res.json();

  const container = document.getElementById('trains-list');
  document.getElementById('train-count').textContent = `${data.trains.length} Trains Found`;
  container.innerHTML = '';

  if (data.trains.length === 0) {
    container.innerHTML = '<div class="train-card">No direct trains found for selected stations.</div>';
    return;
  }

  data.trains.forEach((train) => {
    const vacant = train.totalCap - train.booked;
    const isAvailable = vacant > 0;
    const statusBadge = isAvailable
      ? `<span class="status-badge status-avl">AVAILABLE: ${vacant} SEATS</span>`
      : `<span class="status-badge status-wl">WAITLIST: WL-${train.waitlist}</span>`;

    const card = document.createElement('div');
    card.className = 'train-card';
    card.innerHTML = `
      <div class="train-meta">
        <h3><span class="train-no">${train.trainNo}</span> ${train.name}</h3>
        <div class="train-route"><strong>${train.originName} (${train.origin})</strong> → <strong>${train.destinationName} (${train.destination})</strong> • Departs: <strong>${train.depTime}</strong> (Arr: ${train.arrTime})</div>
        <div class="train-via">Division: ${train.division} | Via: ${train.via.join(' - ')}</div>
      </div>
      <div class="train-action">
        ${statusBadge}
        <div class="fare-text">₹${train.baseFare}</div>
        <button class="btn-book" onclick='initiateBooking(${JSON.stringify(train)})'>
          ${isAvailable ? 'Book Confirmed' : 'Book / Check Options'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function initiateBooking(train) {
  const flexHours = document.getElementById('flex-select').value;
  document.getElementById('book-passenger-name').value = currentUser.name;

  // Query backend recommendation silently (no internal algorithm details exposed)
  const res = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trainNo: train.trainNo, flexHours })
  });
  const rec = await res.json();

  const offerBox = document.getElementById('smart-offer-box');

  if (rec.hasRecommendation) {
    // Store original waitlist train in case user declines offer
    activeBookingContext = {
      targetTrain: train,
      shiftedFromTrainNo: null,
      amountSaved: 0,
      payableFare: train.baseFare,
      offerData: rec
    };

    document.getElementById('modal-train-title').textContent = `${train.trainNo} ${train.name} (Waitlist)`;
    document.getElementById('modal-train-sub').textContent = `${train.originName} → ${train.destinationName} | Departs ${train.depTime}`;
    document.getElementById('modal-payable').textContent = `₹${train.baseFare}`;

    offerBox.style.display = 'block';
    document.getElementById('smart-offer-text').innerHTML = `
      <strong>${train.name}</strong> is currently full (WL-${train.waitlist}). Switch to <strong>${rec.recommendedTrain.trainNo} ${rec.recommendedTrain.name}</strong> departing at <strong>${rec.recommendedTrain.depTime}</strong> with <strong>${rec.availableSeats} confirmed seats</strong> and get an instant <strong>${rec.discountPercent}% Off-Peak Fare Discount</strong>!
    `;

    const acceptBtn = document.getElementById('btn-accept-offer');
    acceptBtn.textContent = `Switch & Save ₹${rec.amountSaved}`;
    acceptBtn.onclick = () => acceptOffPeakOffer(rec);
  } else {
    offerBox.style.display = 'none';
    activeBookingContext = {
      targetTrain: train,
      shiftedFromTrainNo: null,
      amountSaved: 0,
      payableFare: train.baseFare
    };
    document.getElementById('modal-train-title').textContent = `${train.trainNo} ${train.name}`;
    document.getElementById('modal-train-sub').textContent = `${train.originName} → ${train.destinationName} | Departs ${train.depTime}`;
    document.getElementById('modal-payable').textContent = `₹${train.baseFare}`;
  }

  document.getElementById('booking-modal').style.display = 'flex';
}

function acceptOffPeakOffer(rec) {
  const alt = rec.recommendedTrain;
  activeBookingContext = {
    targetTrain: alt,
    shiftedFromTrainNo: rec.peakTrain.trainNo,
    amountSaved: rec.amountSaved,
    payableFare: rec.discountedFare
  };

  document.getElementById('smart-offer-box').style.display = 'none';
  document.getElementById('modal-train-title').textContent = `${alt.trainNo} ${alt.name} (Confirmed Off-Peak)`;
  document.getElementById('modal-train-sub').textContent = `${alt.originName} → ${alt.destinationName} | Departs ${alt.depTime} • ${rec.discountPercent}% Discount Applied`;
  document.getElementById('modal-payable').innerHTML = `<span style="text-decoration:line-through; color:#94a3b8; font-size:14px;">₹${rec.originalFare}</span> ₹${rec.discountedFare}`;
}

function declineOffer() {
  document.getElementById('smart-offer-box').style.display = 'none';
}

function closeModal() {
  document.getElementById('booking-modal').style.display = 'none';
}

document.getElementById('confirm-booking-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const passengerName = document.getElementById('book-passenger-name').value;
  const age = document.getElementById('book-passenger-age').value;

  const res = await fetch('/api/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser.id,
      trainNo: activeBookingContext.targetTrain.trainNo,
      passengerName,
      age,
      shiftedFromTrainNo: activeBookingContext.shiftedFromTrainNo,
      amountSaved: activeBookingContext.amountSaved
    })
  });

  const data = await res.json();
  if (res.ok) {
    currentUser.totalSaved = data.totalSaved;
    sessionStorage.setItem('sr_user', JSON.stringify(currentUser));
    document.getElementById('nav-saved').textContent = `₹${currentUser.totalSaved}`;
    closeModal();
    loadTrains();
    loadUserTickets();
  }
});

async function loadUserTickets() {
  const res = await fetch(`/api/user/${currentUser.id}/summary`);
  const data = await res.json();
  const list = document.getElementById('tickets-list');
  list.innerHTML = '';

  if (!data.bookings || data.bookings.length === 0) {
    list.innerHTML = '<div class="ticket-card" style="color:#64748b; font-size:13px;">No tickets booked yet. Search a Southern Railway route to book.</div>';
    return;
  }

  data.bookings.forEach((b) => {
    const card = document.createElement('div');
    card.className = `ticket-card ${b.isShifted ? 'shifted' : ''}`;
    card.innerHTML = `
      <div class="ticket-top">
        <span>PNR: <strong>${b.pnr}</strong></span>
        <span><strong>${b.status}</strong></span>
      </div>
      <div class="ticket-title">${b.trainNo} ${b.trainName}</div>
      <div style="font-size:12px; color:#475569; margin-top:4px;">
        ${b.origin} → ${b.destination} | Dep: ${b.depTime}
      </div>
      <div style="font-size:12px; margin-top:6px; display:flex; justify-content:space-between;">
        <span>Passenger: ${b.passengerName}</span>
        <span>Paid: <strong>₹${b.farePaid}</strong></span>
      </div>
      ${b.amountSaved > 0 ? `<div class="saved-tag">Saved ₹${b.amountSaved} via Off-Peak Shift</div>` : ''}
    `;
    list.appendChild(card);
  });
}

// Initial Load
loadTrains();
loadUserTickets();