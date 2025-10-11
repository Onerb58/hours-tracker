# 🧩 Project Prime: Work Hours Tracker (Vanilla JS + Firebase + GH Pages)

## 🔍 Overview
This project transforms a static HTML-based work hours tracker into a lightweight, multi-device web app hosted on **GitHub Pages**, with data stored in **Firebase Firestore**.  
The app remains framework-free (Vanilla JS) and prioritizes simplicity, responsiveness, and ease of use.

---

## ⚙️ Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| Frontend | Vanilla JavaScript (ES6 modules) | Lightweight and compatible with GitHub Pages |
| Styling | Custom CSS or Tailwind CDN | Clean, modern layout |
| Database | Firebase Firestore | Cloud-based storage, sync across devices |
| Hosting | GitHub Pages | Free static site hosting |
| Export | CSV via JS Blob | Local export of hours data |

---

## 🧱 Folder Structure

```
work-hours-tracker/
│
├── index.html
├── styles.css
├── app.js
├── firebase-config.js
└── utils/
    ├── date.js
    └── export.js
```

---

## 🗓 Core Features

### 1. Week Pagination
- Navigate between weeks using “Previous Week” and “Next Week” buttons.  
- Each week automatically displays Monday–Sunday dates.  
- The current week loads by default.

### 2. Data Entry
- Editable table cells for `hours`, `task`, and `notes`.  
- Auto-save updates to Firestore as the user types.  
- Show a small “Saved” indicator after successful writes.

### 3. Firestore Sync
- Fetch entries for the selected week on load.  
- Push updates in real time when cells are edited.  
- Data structure:

```js
/users/<USER_ID>/weeks/<YYYY-MM-DD>/entries/<doc>
{
  date: "2025-10-06",
  weekday: "Monday",
  hours: 8,
  task: "Editing",
  notes: "Article draft"
}
```

### 4. CSV Export
- “Export CSV” button creates a downloadable file for either the current week or all stored data.

### 5. UI Design
- Simple, responsive table layout.  
- Clean typography and spacing.  
- Optional dark/light mode toggle.

---

## 🚀 Firebase Setup

1. Create a new Firebase project.  
2. Add a **Web App** → copy the config snippet into `firebase-config.js`.  
3. Enable **Firestore Database**.  
4. (Optional) Enable **Anonymous Auth** for secure write access.  
5. Firestore Rules:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId=**} {
      allow read, write: if true; // Restrict further if needed
    }
  }
}
```

---

## 🧭 Development Steps

| Step | Description | Est. Effort |
|------|--------------|-------------|
| 1 | Setup Firebase and test connection | 30 min |
| 2 | Build base HTML layout | 1 hr |
| 3 | Add week pagination logic | 1.5 hr |
| 4 | Implement Firestore CRUD | 2 hr |
| 5 | Add auto-save and visual feedback | 1 hr |
| 6 | Implement CSV export | 45 min |
| 7 | Style cleanup and responsiveness | 1.5 hr |
| 8 | Deploy to GitHub Pages | 15 min |

---

## 🔐 Security Notes
- Single-user app; no multi-account management.  
- Optional Firebase Auth to restrict access.  
- Avoid committing private API keys in public repos — use `.env` locally for testing if needed.

---

## 🧩 Claude’s Responsibilities
Claude should:
1. Maintain a fully **Vanilla JS** implementation (no frameworks).  
2. Use modular, well-named functions (`loadWeekData()`, `saveEntry()`, `renderTable()`, etc.).  
3. Implement Firebase v9+ modular SDK.  
4. Handle week-based pagination cleanly.  
5. Implement CSV export via Blob API.  
6. Produce a **responsive and minimal interface**.  
7. Keep all scripts as ES modules and reference them in `index.html`.  
8. Ensure the final build runs directly on GitHub Pages.

---

## ✅ Deliverables
- Working web app hosted on GH Pages (e.g., `https://username.github.io/work-hours-tracker`).  
- Real-time data sync through Firebase Firestore.  
- CSV export of tracked hours.  
- Clean, intuitive interface optimized for multi-device use.

