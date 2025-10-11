# Work Hours Tracker

A lightweight, cloud-synced work hours tracker built with Vanilla JavaScript and Firebase.

## Features

- **Week-based navigation** - Browse your work hours by week (Monday-Sunday)
- **Auto-save** - Changes are automatically saved to Firebase Firestore
- **Real-time sync** - Access your data from any device
- **CSV Export** - Export weekly or all-time data to CSV
- **Responsive design** - Works on desktop, tablet, and mobile
- **Simple & fast** - No frameworks, just vanilla JavaScript

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Database**: Firebase Firestore
- **Hosting**: GitHub Pages
- **Styling**: Custom CSS

## Live Demo

🔗 [View Live App](https://[your-username].github.io/tracker)

## Getting Started

### Prerequisites

- A Firebase project with Firestore enabled
- A web browser
- (Optional) Python 3 for local development

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/[your-username]/tracker.git
   cd tracker
   ```

2. Update Firebase configuration in `firebase-config.js` with your credentials

3. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```

4. Open http://localhost:8000 in your browser

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Firestore Database** in test mode
3. Enable **Anonymous Authentication**
4. Add a web app and copy the configuration to `firebase-config.js`
5. Update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Usage

1. **Track hours**: Click on any cell to enter hours, tasks, or notes
2. **Navigate weeks**: Use Previous/Next buttons to view different weeks
3. **View totals**: See summary statistics at the bottom
4. **Export data**: Click export buttons to download CSV files

## Project Structure

```
tracker/
├── index.html          # Main HTML
├── styles.css          # Styling
├── app.js             # Main application logic
├── firebase-config.js # Firebase configuration
└── utils/
    ├── date.js        # Date utilities
    └── export.js      # CSV export utilities
```

## Data Structure

Entries are stored in Firestore with the following structure:

```
/users/{userId}/weeks/{weekId}/entries/{date}
{
  date: "2025-10-06",
  weekday: "Monday",
  hours: 8,
  task: "Development",
  notes: "Working on new feature"
}
```

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
