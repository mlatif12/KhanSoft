// ── dashboard.js ──────────────────────────────────


// ── Global variables ──────────────────────────────
var currentUser = null;   // the logged-in user's data
var tasks       = [];     // all tasks for this user
var editingId   = null;   // id of task being edited (null = new task)
var draggedId   = null;   // id of task being dragged
var bsModal     = null;   // Bootstrap modal instance


// ── 1. SETUP ──────────────────────────────────────

window.onload = function () {
  // If no session found, redirect back to login
  var session = localStorage.getItem('session');
  if (session === null) {
    window.location.href = 'login.html';
    return;
  }

  // Load the user and their tasks
  currentUser = JSON.parse(session);
  loadTasks();

  // Fill in user info on the sidebar
  document.getElementById('sbName').textContent   = currentUser.name;
  document.getElementById('sbEmail').textContent  = currentUser.email;
  document.getElementById('sbAvatar').textContent = currentUser.name.charAt(0).toUpperCase();

  // Show today's date in the topbar
  document.getElementById('todayDate').textContent = new Date().toDateString();

  // Set up Bootstrap modal
  bsModal = new bootstrap.Modal(document.getElementById('taskModal'));

  // Apply saved theme (default: dark)
  var savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  // Render the dashboard
  renderDashboard();
  renderKanban();
};

// Load this user's tasks from localStorage
function loadTasks() {
  var data = localStorage.getItem('tasks_' + currentUser.id);
  tasks = data ? JSON.parse(data) : [];
}

// Save tasks back to localStorage
function saveTasks() {
  localStorage.setItem('tasks_' + currentUser.id, JSON.stringify(tasks));
}


// ── 2. THEME ──────────────────────────────────────

function applyTheme(theme) {
  document.body.classList.remove('dark', 'light');
  document.body.classList.add(theme);
  localStorage.setItem('theme', theme);

  // Update the icon and label on the sidebar button
  if (theme === 'dark') {
    document.getElementById('themeIcon').className = 'bi bi-sun me-2';
    document.getElementById('themeTxt').textContent = 'Light Mode';
  } else {
    document.getElementById('themeIcon').className = 'bi bi-moon me-2';
    document.getElementById('themeTxt').textContent = 'Dark Mode';
  }
}

function toggleTheme() {
  var isDark = document.body.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
}


// ── 3. AUTH ───────────────────────────────────────

function doLogout() {
  localStorage.removeItem('session');
  window.location.href = 'login.html';
}


// ── 4. NAVIGATION ─────────────────────────────────

// goTo: show the dashboard page or the tasks page
function goTo(page, btn) {
  // Hide both pages
  document.getElementById('pgDashboard').classList.remove('active');
  document.getElementById('pgTasks').classList.remove('active');

  // Show the requested page
  if (page === 'dashboard') {
    document.getElementById('pgDashboard').classList.add('active');
    document.getElementById('pageTitle').textContent = 'Dashboard';
    renderDashboard();
  } else {
    document.getElementById('pgTasks').classList.add('active');
    document.getElementById('pageTitle').textContent = 'My Tasks';
    renderKanban();
  }

  // Update the active highlight on nav buttons
  document.getElementById('navDash').classList.remove('active');
  document.getElementById('navTasks').classList.remove('active');
  if (btn !== null) {
    btn.classList.add('active');
  }

  closeSidebar(); // close sidebar on mobile after navigating
}


// ── 5. SIDEBAR (mobile) ───────────────────────────

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').style.display = 'block';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').style.display = 'none';
}


// ── 6. DASHBOARD ──────────────────────────────────

function renderDashboard() {
  // Count tasks by status
  var total = tasks.length;
  var todo  = 0, progress = 0, done = 0;

  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].status === 'todo')     todo++;
    if (tasks[i].status === 'progress') progress++;
    if (tasks[i].status === 'done')     done++;
  }

  // Update the 4 stat cards
  document.getElementById('stTotal').textContent    = total;
  document.getElementById('stTodo').textContent     = todo;
  document.getElementById('stProgress').textContent = progress;
  document.getElementById('stDone').textContent     = done;

  // Calculate and show completion percentage
  var pct = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('progPct').textContent = pct + '%';
  document.getElementById('progBar').style.width  = pct + '%';

  // Show the 5 most recently created tasks
  var sorted = tasks.slice().sort(function (a, b) {
    return b.createdAt - a.createdAt; // newest first
  });

  var html = '';

  if (sorted.length === 0) {
    html = '<p class="text-muted" style="font-size:13px">No tasks yet. Add one!</p>';
  } else {
    for (var j = 0; j < Math.min(sorted.length, 5); j++) {
      var t = sorted[j];
      var isDone = (t.status === 'done');

      html += '<div class="d-flex align-items-center gap-2 py-2" style="border-bottom:1px solid rgba(128,128,128,0.2)">';
      html += '  <input type="checkbox" ' + (isDone ? 'checked' : '') + ' onchange="toggleDone(\'' + t.id + '\')" />';
      html += '  <span class="flex-grow-1 ' + (isDone ? 'done-title' : '') + '" style="font-size:14px">' + safe(t.title) + '</span>';
      html += '  <span class="badge badge-' + t.priority + '">' + t.priority + '</span>';
      html += '</div>';
    }
  }

  document.getElementById('recentList').innerHTML = html;
}

// Toggle a task between done and todo (used in recent list checkboxes)
function toggleDone(id) {
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id === id) {
      tasks[i].status = (tasks[i].status === 'done') ? 'todo' : 'done';
      break;
    }
  }
  saveTasks();
  renderDashboard();
  renderKanban();
}


// ── 7. KANBAN BOARD ───────────────────────────────

function renderKanban() {
  // Read search and filter values
  var search   = document.getElementById('searchBox')   ? document.getElementById('searchBox').value.toLowerCase()   : '';
  var filPrio  = document.getElementById('filPriority') ? document.getElementById('filPriority').value : '';
  var filCat   = document.getElementById('filCategory') ? document.getElementById('filCategory').value : '';

  // Filter tasks based on search/filter inputs
  var filtered = tasks.filter(function (t) {
    var matchSearch = search === ''   || t.title.toLowerCase().includes(search);
    var matchPrio   = filPrio === ''  || t.priority === filPrio;
    var matchCat    = filCat === ''   || t.category === filCat;
    return matchSearch && matchPrio && matchCat;
  });

  // Render each column
  renderColumn('todo',     filtered);
  renderColumn('progress', filtered);
  renderColumn('done',     filtered);
}

// renderColumn: build HTML for one kanban column
function renderColumn(status, filteredTasks) {
  // Map status to element IDs
  var zoneId = { todo: 'zoneTodo', progress: 'zoneProgress', done: 'zoneDone' }[status];
  var countId = { todo: 'cntTodo', progress: 'cntProgress', done: 'cntDone' }[status];

  // Get only tasks for this column
  var colTasks = filteredTasks.filter(function (t) {
    return t.status === status;
  });

  // Update count badge
  document.getElementById(countId).textContent = colTasks.length;

  // Show empty message if no tasks
  if (colTasks.length === 0) {
    document.getElementById(zoneId).innerHTML =
      '<p class="text-muted text-center py-4" style="font-size:13px">No tasks here</p>';
    return;
  }

  // Build task cards
  var html = '';
  for (var i = 0; i < colTasks.length; i++) {
    var t = colTasks[i];
    var isDone = (t.status === 'done');

    html += '<div class="task-item" id="tc-' + t.id + '" draggable="true"';
    html += '  ondragstart="dragStart(event, \'' + t.id + '\')"';
    html += '  ondragend="dragEnd(event)">';

    // Title row with action buttons
    html += '<div class="d-flex justify-content-between align-items-start mb-2">';
    html += '  <span class="fw-semibold ' + (isDone ? 'done-title' : '') + '" style="font-size:14px">' + safe(t.title) + '</span>';
    html += '  <div class="d-flex gap-1">';
    html += '    <button class="btn btn-sm p-0 px-1 text-success" onclick="toggleDone(\'' + t.id + '\')" title="Mark Done"><i class="bi bi-check-lg"></i></button>';
    html += '    <button class="btn btn-sm p-0 px-1 text-primary"  onclick="openEdit(\'' + t.id + '\')"   title="Edit"><i class="bi bi-pencil"></i></button>';
    html += '    <button class="btn btn-sm p-0 px-1 text-danger"   onclick="deleteTask(\'' + t.id + '\')" title="Delete"><i class="bi bi-trash"></i></button>';
    html += '  </div>';
    html += '</div>';

    // Badges row (priority, category, due date)
    html += '<div class="d-flex gap-2 flex-wrap align-items-center">';
    html += '  <span class="badge badge-' + t.priority + '">' + t.priority + '</span>';
    html += '  <span class="badge bg-secondary">' + t.category + '</span>';
    if (t.due) {
      html += '  <span class="text-muted" style="font-size:11px"><i class="bi bi-calendar3"></i> ' + t.due + '</span>';
    }
    html += '</div>';

    html += '</div>'; // end task-item
  }

  document.getElementById(zoneId).innerHTML = html;
}


// ── 8. TASK MODAL ─────────────────────────────────

// Open modal for creating a new task
function openModal() {
  editingId = null;

  document.getElementById('modalHeading').textContent = 'New Task';
  document.getElementById('fTitle').value    = '';
  document.getElementById('fDesc').value     = '';
  document.getElementById('fPriority').value = 'medium';
  document.getElementById('fCategory').value = 'Work';
  document.getElementById('fStatus').value   = 'todo';
  document.getElementById('fDue').value      = '';

  bsModal.show();
}

// Open modal pre-filled with an existing task's data
function openEdit(id) {
  var task = tasks.find(function (t) { return t.id === id; });
  if (!task) { return; }

  editingId = id;

  document.getElementById('modalHeading').textContent = 'Edit Task';
  document.getElementById('fTitle').value    = task.title;
  document.getElementById('fDesc').value     = task.desc     || '';
  document.getElementById('fPriority').value = task.priority;
  document.getElementById('fCategory').value = task.category;
  document.getElementById('fStatus').value   = task.status;
  document.getElementById('fDue').value      = task.due      || '';

  bsModal.show();
}

// Save the task (create or update)
function saveTask() {
  var title = document.getElementById('fTitle').value.trim();

  if (title === '') {
    showToast('Please enter a title!', 'error');
    return;
  }

  if (editingId !== null) {
    // Update existing task
    var task = tasks.find(function (t) { return t.id === editingId; });
    if (task) {
      task.title    = title;
      task.desc     = document.getElementById('fDesc').value.trim();
      task.priority = document.getElementById('fPriority').value;
      task.category = document.getElementById('fCategory').value;
      task.status   = document.getElementById('fStatus').value;
      task.due      = document.getElementById('fDue').value;
    }
    showToast('Task updated!', 'success');

  } else {
    // Create a new task
    tasks.push({
      id:        'task_' + Date.now(),
      createdAt: Date.now(),
      title:     title,
      desc:      document.getElementById('fDesc').value.trim(),
      priority:  document.getElementById('fPriority').value,
      category:  document.getElementById('fCategory').value,
      status:    document.getElementById('fStatus').value,
      due:       document.getElementById('fDue').value
    });
    showToast('Task added!', 'success');
  }

  saveTasks();
  renderDashboard();
  renderKanban();
  bsModal.hide();
}


// ── 9. DELETE TASK ────────────────────────────────

function deleteTask(id) {
  // Filter out the task with this id
  tasks = tasks.filter(function (t) { return t.id !== id; });
  saveTasks();
  renderDashboard();
  renderKanban();
  showToast('Task deleted.', 'error');
}


// ── 10. DRAG & DROP ───────────────────────────────

function dragStart(event, id) {
  draggedId = id;
  // Small delay so the card fades AFTER the grab animation starts
  setTimeout(function () {
    var el = document.getElementById('tc-' + id);
    if (el) { el.classList.add('dragging'); }
  }, 0);
}

function dragEnd(event) {
  // Remove "dragging" style from all cards
  document.querySelectorAll('.task-item').forEach(function (el) {
    el.classList.remove('dragging');
  });
}

function onOver(event) {
  event.preventDefault(); // Required to allow dropping
  event.currentTarget.classList.add('over');
}

function onLeave(event) {
  event.currentTarget.classList.remove('over');
}

function onDrop(event, newStatus) {
  event.preventDefault();
  event.currentTarget.classList.remove('over');

  if (draggedId === null) { return; }

  // Update the dragged task's status
  var task = tasks.find(function (t) { return t.id === draggedId; });
  if (task) {
    task.status = newStatus;
  }

  draggedId = null;
  saveTasks();
  renderDashboard();
  renderKanban();
  showToast('Task moved!', 'info');
}


// ── 11. TOAST NOTIFICATIONS ───────────────────────

// Show a small temporary message in the bottom-right corner
// type: 'success' (green), 'error' (red), 'info' (yellow)
function showToast(message, type) {
  var colors = { success: '#198754', error: '#dc3545', info: '#ffc107' };

  var el = document.createElement('div');
  el.className = 'my-toast';
  el.style.borderLeft = '4px solid ' + (colors[type] || '#198754');
  el.textContent = message;

  document.getElementById('toastBox').appendChild(el);

  // Remove the toast after 2.5 seconds
  setTimeout(function () { el.remove(); }, 2500);
}


// ── 12. HELPERS ───────────────────────────────────

// safe: escapes HTML special characters to prevent XSS
// Always use this before putting user text into innerHTML
function safe(text) {
  if (!text) { return ''; }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
