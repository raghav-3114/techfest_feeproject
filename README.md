# TechFest 2027 Registration Portal

A modern, secure, and interactive registration portal for TechFest 2027. Built with a sleek glassmorphic UI and an Express.js backend for secure OTP-based authentication and SQLite registration management.

## Features

- **Mandatory OTP Security:** Users must securely authenticate via a simulated SMS OTP to access the platform.
- **Dynamic Registration System:** Robust server-side validation to ensure uniqueness of registrations per email and event.
- **Admin Dashboard:** A secured portal providing an overview of all active registrations, with abilities to reset and monitor candidate flow.
- **Glassmorphic UI Elements:** A visually stunning frontend utilizing modern CSS variables and dark-themed aesthetics.
- **Floating Support Assistant:** Built-in floating chat interface providing real-time FAQs.

## Tech Stack

- **Frontend:** HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+), FontAwesome
- **Backend:** Node.js, Express.js, CORS
- **Database:** SQLite3

## Installation and Setup

1. **Install Dependencies:**
   Ensure you have [Node.js](https://nodejs.org/) installed, then run:
   ```bash
   npm install
   ```

2. **Start the Backend Server:**
   This project relies on the Node.js backend to serve API requests.
   ```bash
   node server.js
   ```
   The backend will run on `http://localhost:3000`.

3. **Open the Application:**
   Once the backend is running, open `index.html` in your web browser. A local development server like VS Code Live Server is recommended for the best experience.

## Usage Notes

- **Mock OTP:** Since this is a demonstration environment, the OTP SMS is simulated. The code will display directly in the UI under the login form when requested, allowing you to copy/paste it into the secure input boxes. Real SMS integration would require a paid third-party provider like Twilio.
