# External Integrations & Services

## Database: MongoDB Atlas
- **Driver**: `mongoose` (v8.2.1)
- **Connection URI**: Stored securely in `server/.env` (`MONGODB_URI`).
- **Cluster**: Remote MongoDB Atlas shard cluster (`cluster0.xxeclfp.mongodb.net`).
- **Connection Strategy**: Single pooled connection initialized via `server/config/db.js` with auto-reconnect and monitor listeners.

## Simulated Interface Integrations
- **Mock Interfaces**:
  - `browser` / `phishing`: Simulated web pages with URL bar and warning/action mockups.
  - `email`: Authenticated webmail inbox/view mocks with headers, verified sender labels, and responsive layout.
  - `sms` / `chat`: Phone messaging and WhatsApp conversation mockups.
  - `phone`: Incoming voice call with interactive Decline and Accept affordances.
  - `upi`: Payment collect requests and QR scan mockups with contextual environmental observation notes.
  - `os_prompt`: Android/iOS permission request dialogs.
- **Privacy Guarantee**: All simulated interfaces are decorative and illustrative. No user passwords, PINs, OTPs, or financial identifiers are ever captured, logged, or transmitted.

## Client-Server REST Contract
- **Base URL**: `http://localhost:5000/api`
- **Authentication**: `Authorization: Bearer <JWT>`
- **Key Assessment Endpoints**:
  - `GET /api/assessments/:code`: Fetches published scenario metadata.
  - `POST /api/assessments/start`: Creates in-progress `AssessmentSession` and returns Stage 1.
  - `POST /api/assessments/submit-step`: Authoritatively processes user decision, mutates state, and returns next stage or final scores.
  - `GET /api/assessments/status/:scenarioCode`: Checks for active or completed sessions on page load.
  - `GET /api/assessments/session/:sessionId`: Resumes an active in-progress session.
