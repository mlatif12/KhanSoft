# TaskFlow – Smart Task Manager

A clean, beginner-friendly task manager built with HTML, CSS (Bootstrap 5), and vanilla JavaScript.

---

## Folder Structure

```
TaskFlow/
├── login.html       ← Sign In page
├── signup.html      ← Create Account page
├── dashboard.html   ← Main app (tasks, kanban board)
├── css/
│   └── style.css    ← All custom styles
└── js/
    ├── login.js     ← Sign in logic
    ├── signup.js    ← Sign up logic
    └── dashboard.js ← All app logic (tasks, kanban, theme)
```

---

## How to Run

Just open `login.html` in your browser. No server needed — everything runs in the browser using `localStorage`.

---

## How It Works

### Authentication
- **Signup** (`signup.html` + `js/signup.js`): Saves a new user to `localStorage`.
- **Login** (`login.html` + `js/login.js`): Checks credentials and saves a session.
- **Logout** (`dashboard.js`): Clears the session and redirects to login.

### Dashboard (`dashboard.html` + `js/dashboard.js`)
- Checks for a valid session on load — redirects to login if none found.
- **Stats**: Counts tasks by status (todo / in progress / done).
- **Progress bar**: Shows % of tasks completed.
- **Recent tasks**: Lists the 5 newest tasks with a checkbox toggle.
- **Kanban board**: 3 columns with drag-and-drop support.
- **Task modal**: Add or edit tasks (title, priority, category, status, due date).

### Data Storage
All data is stored in the browser's `localStorage`:
- `users` — array of all registered users
- `tasks_<userId>` — tasks for a specific user
- `session` — the currently logged-in user
- `theme` — saved theme preference (dark/light)

---

## Key Concepts Used

| Concept | Where |
|---|---|
| `localStorage` get/set | login.js, signup.js, dashboard.js |
| DOM manipulation | dashboard.js — renderDashboard(), renderKanban() |
| Event handling | HTML onclick attributes |
| Array methods (filter, find, sort) | dashboard.js |
| Bootstrap Modal | dashboard.js — bsModal.show() / hide() |
| Drag & Drop API | dashboard.js — dragStart, onDrop |
| CSS custom themes | style.css — body.dark / body.light |
