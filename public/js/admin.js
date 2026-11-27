const adminSession = JSON.parse(sessionStorage.getItem('sr_admin'));
if (!adminSession || adminSession.role !== 'admin') {
  window.location.href = '/index.html';
}

function logoutAdmin() {
  sessionStorage.removeItem('sr_admin');
  window.location.href = '/index.html';
}

async function loadAdminData() {
  const res = await fetch('/api/admin/overview');
  const data = await res.json();

  // Populate KPIs
  document.getElementById('kpi-shifted').textContent = data.metrics.totalShifted;
  document.getElementById('kpi-recovered').textContent = `₹${data.metrics.revenueRecovered.toLocaleString('en-IN')}`;
  document.getElementById('kpi-lost').textContent = `₹${data.metrics.revenueLost.toLocaleString('en-IN')}`;
  document.getElementById('kpi-empty-seats').textContent = data.metrics.unutilizedSeats;
  document.getElementById('kpi-total-bookings').textContent = data.metrics.totalBookings;

  // Populate Mechanism Controls
  const cfg = data.config;
  document.getElementById('cfg-enabled').value = String(cfg.engineEnabled);
  document.getElementById('cfg-buffer').value = cfg.minBufferSeats;
  document.getElementById('cfg-t1-thresh').value = cfg.tier1VacancyThreshold;
  document.getElementById('cfg-t1-disc').value = cfg.tier1Discount;
  document.getElementById('cfg-t2-thresh').value = cfg.tier2VacancyThreshold;
  document.getElementById('cfg-t2-disc').value = cfg.tier2Discount;
  document.getElementById('cfg-t3-disc').value = cfg.tier3Discount;

  // Populate Shift & Booking Ledger
  const ledger = document.getElementById('ledger-body');
  ledger.innerHTML = '';
  if (data.recentBookings.length === 0) {
    ledger.innerHTML = '<tr><td colspan="5">No bookings recorded yet.</td></tr>';
  } else {
    data.recentBookings.forEach((b) => {
      const typeTag = b.isShifted
        ? `<span class="tag-bw solid">SHIFTED (FROM ${b.shiftedFromTrainNo})</span>`
        : `<span class="tag-bw">STANDARD (${b.status})</span>`;
      ledger.innerHTML += `
        <tr>
          <td><strong>${b.pnr}</strong></td>
          <td>${b.passengerName}</td>
          <td>${b.trainNo} ${b.trainName}</td>
          <td>${typeTag}</td>
          <td>₹${b.farePaid}</td>
        </tr>
      `;
    });
  }

  // Populate Fleet Telemetry
  const fleet = document.getElementById('fleet-body');
  fleet.innerHTML = '';
  data.trains.forEach((t) => {
    const empty = t.totalCap - t.booked;
    const lostVal = empty * t.baseFare;
    const status =
      empty === 0
        ? `<span class="tag-bw solid">PEAK FULL (WL: ${t.waitlist})</span>`
        : `<span class="tag-bw">OFF-PEAK (${empty} EMPTY)</span>`;

    fleet.innerHTML += `
      <tr>
        <td><strong>${t.trainNo}</strong></td>
        <td>${t.name}</td>
        <td>${t.origin} → ${t.destination}</td>
        <td>${t.depTime}</td>
        <td>${t.booked} / ${t.totalCap}</td>
        <td>${status}</td>
        <td>₹${lostVal.toLocaleString('en-IN')}</td>
      </tr>
    `;
  });
}

document.getElementById('config-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    engineEnabled: document.getElementById('cfg-enabled').value === 'true',
    minBufferSeats: document.getElementById('cfg-buffer').value,
    tier1VacancyThreshold: document.getElementById('cfg-t1-thresh').value,
    tier1Discount: document.getElementById('cfg-t1-disc').value,
    tier2VacancyThreshold: document.getElementById('cfg-t2-thresh').value,
    tier2Discount: document.getElementById('cfg-t2-disc').value,
    tier3Discount: document.getElementById('cfg-t3-disc').value
  };

  const res = await fetch('/api/admin/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    const status = document.getElementById('cfg-status');
    status.textContent = 'MECHANISM PARAMETERS UPDATED LIVE.';
    setTimeout(() => (status.textContent = ''), 3000);
    loadAdminData();
  }
});

async function resetSimulation() {
  await fetch('/api/admin/reset', { method: 'POST' });
  loadAdminData();
}

loadAdminData();