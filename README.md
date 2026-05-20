# TechFest 2026 Registration Portal

A modern, secure, and interactive registration portal for TechFest 2026. Built with a sleek glassmorphic UI and an Express.js backend for secure OTP-based authentication and registration management.

## Features

- **Mandatory OTP Security:** Users must securely authenticate via a simulated SMS OTP to access the platform.
- **Dynamic Registration System:** Robust server-side validation to ensure uniqueness of registrations per email and event.
- **Admin Dashboard:** A secured portal providing an overview of all active registrations, with abilities to reset and monitor candidate flow.
- **Glassmorphic UI Elements:** A visually stunning frontend utilizing modern CSS variables and dark-themed aesthetics.
- **Floating Support Assistant:** Built-in floating chat interface providing real-time FAQs.

## Tech Stack

- **Frontend:** HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+), FontAwesome
- **Backend:** Node.js, Express.js, CORS
- **Database:** JSON file storage for demo deployment

## Installation and Setup

1. **Install Dependencies:**
   Ensure you have [Node.js](https://nodejs.org/) installed, then run:
   ```bash
   npm install
   ```

2. **Start the Backend Server:**
   This project relies on the Node.js backend to serve API requests.
   ```bash
   npm start
   ```
   The backend will run on `http://localhost:3000`.

3. **Open the Application:**
   Once the backend is running, open `http://localhost:3000` in your web browser. Opening the HTML files directly or through a separate Live Server can point the frontend at the wrong API, which prevents registrations from appearing in the local admin dashboard.

## Registration Storage

- Registration data is saved by the backend in `techfest-data.json`, not in browser session storage or local storage.
- Duplicate registrations are blocked server-side for the same email and event.
- For hosted deployments, set `DATA_DIR` or `DATA_FILE` to a persistent disk/location. Without persistent server storage, platforms with ephemeral filesystems can lose JSON data after restarts or redeploys.

## Usage Notes

- **Mock OTP:** Since this is a demonstration environment, the OTP SMS is simulated. The code will display directly in the UI under the login form when requested, allowing you to copy/paste it into the secure input boxes. Real SMS integration would require a paid third-party provider like Twilio.
