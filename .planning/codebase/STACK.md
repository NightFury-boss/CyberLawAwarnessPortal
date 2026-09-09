# Technology Stack & Runtime Environment

## Runtime & Core Languages
- **Node.js**: v24.19.0 (CommonJS modules on backend)
- **Frontend Framework**: React 19.2.8 with Vite 8.2.1 build toolchain
- **Styling**: Vanilla CSS (`main.css`) + CSS Modules, custom responsive design systems
- **Operating System / Target**: Windows (x64) with cross-platform Node/Vite support

## Backend Infrastructure
- **Web Framework**: Express 4.19.2
- **Database**: MongoDB Atlas Cluster via Mongoose 8.2.1
- **Authentication**: JWT (`jsonwebtoken` 9.0.2), password hashing via `bcryptjs` 2.4.3
- **CORS & Middleware**: `cors` 2.8.5, custom `authMiddleware.js`
- **Configuration**: `dotenv` 16.4.5 loading from `server/.env`

## Frontend Infrastructure
- **Routing**: `react-router-dom` v6
- **Icons**: `lucide-react`
- **Data Fetching**: Native `fetch` with centralized API client service (`client/src/services/api.js`)
- **State Management**: React Hooks (`useState`, `useEffect`, `useRef`, `useContext`)
- **Storage**: `localStorage` (JWT token, user info), `sessionStorage` (active assessment session resume caching)

## Testing & Quality Assurance
- **Custom Test Runners**: Pure Node.js test suites with embedded Express listeners and assertion frameworks
  - `server/tests/digitalDay.test.js`: Phase 2.3/2.4 comprehensive 13-stage adaptive branching and scoring test suite
  - `server/tests/deltaIsolation.test.js`: Cross-version score isolation verification
  - `server/tests/fixtureValidation.test.js`: Multi-fixture 41-assertion controlled validation
  - `server/tests/api.test.js`: Security, error schemas, double-click CAS replay protection, role restriction
  - `server/utils/verifyScenarios.js`: Scenario database graph and edge reference integrity checker
