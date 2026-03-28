// ── signup.js ─────────────────────────────────────
// Handles the Create Account form on signup.html

function doSignup() {
  var name     = document.getElementById('name').value.trim();
  var email    = document.getElementById('email').value.trim();
  var password = document.getElementById('password').value;
  var errorEl  = document.getElementById('errorMsg');
  var successEl = document.getElementById('successMsg');

  // Hide previous messages
  errorEl.style.display  = 'none';
  successEl.style.display = 'none';

  // Validate: all fields are required
  if (name === '' || email === '' || password === '') {
    errorEl.textContent  = 'Please fill in all fields.';
    errorEl.style.display = 'block';
    return;
  }

  // Validate: password must be at least 6 characters
  if (password.length < 6) {
    errorEl.textContent  = 'Password must be at least 6 characters.';
    errorEl.style.display = 'block';
    return;
  }

  // Load existing users from localStorage
  var users = JSON.parse(localStorage.getItem('users') || '[]');

  // Check if this email is already taken
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email) {
      errorEl.textContent  = 'This email is already registered. Please sign in.';
      errorEl.style.display = 'block';
      return;
    }
  }

  // Create the new user object
  var newUser = {
    id:    Date.now(),  // unique ID using current timestamp
    name:  name,
    email: email,
    pass:  password
  };

  // Save user to the users list
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  // Create an empty task list for this new user
  localStorage.setItem('tasks_' + newUser.id, JSON.stringify([]));

  // Show success message, then redirect to login after 1.5 seconds
  successEl.textContent  = 'Account created! Redirecting to sign in…';
  successEl.style.display = 'block';
  setTimeout(function () {
    window.location.href = 'login.html';
  }, 1500);
}
