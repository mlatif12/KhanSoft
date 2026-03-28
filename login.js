// ── login.js ──────────────────────────────────────
// Handles the Sign In form on login.html

function doLogin() {
  var email    = document.getElementById('email').value.trim();
  var password = document.getElementById('password').value;
  var errorEl  = document.getElementById('errorMsg');

  // Hide any previous error
  errorEl.style.display = 'none';

  // Validate: both fields required
  if (email === '' || password === '') {
    errorEl.textContent  = 'Please enter your email and password.';
    errorEl.style.display = 'block';
    return;
  }

  // Load all registered users from localStorage
  var users = JSON.parse(localStorage.getItem('users') || '[]');

  // Find a user with matching email AND password
  var matchedUser = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email && users[i].pass === password) {
      matchedUser = users[i];
      break;
    }
  }

  // No match found
  if (matchedUser === null) {
    errorEl.textContent  = 'Wrong email or password. Please try again.';
    errorEl.style.display = 'block';
    return;
  }

  // Save session so dashboard knows who is logged in
  localStorage.setItem('session', JSON.stringify(matchedUser));

  // Redirect to the dashboard
  window.location.href = 'dashboard.html';
}
