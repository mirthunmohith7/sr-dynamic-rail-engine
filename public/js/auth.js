function switchAuthTab(mode) {
  const loginTab = document.getElementById('tab-login');
  const regTab = document.getElementById('tab-register');
  const loginSec = document.getElementById('login-section');
  const regSec = document.getElementById('register-section');

  if (mode === 'login') {
    loginTab.classList.add('active');
    regTab.classList.remove('active');
    loginSec.style.display = 'block';
    regSec.style.display = 'none';
  } else {
    regTab.classList.add('active');
    loginTab.classList.remove('active');
    regSec.style.display = 'block';
    loginSec.style.display = 'none';
  }
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errBox = document.getElementById('login-error');
  errBox.style.display = 'none';

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (!res.ok) {
    errBox.textContent = data.error;
    errBox.style.display = 'block';
    return;
  }

  if (data.role === 'admin') {
    sessionStorage.setItem('sr_admin', JSON.stringify(data));
    window.location.href = '/admin.html';
  } else {
    sessionStorage.setItem('sr_user', JSON.stringify(data.user));
    window.location.href = '/dashboard.html';
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const errBox = document.getElementById('register-error');
  errBox.style.display = 'none';

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();

  if (!res.ok) {
    errBox.textContent = data.error;
    errBox.style.display = 'block';
    return;
  }

  sessionStorage.setItem('sr_user', JSON.stringify(data.user));
  window.location.href = '/dashboard.html';
});