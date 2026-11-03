# AlgoSaathi 🧠💻

**AlgoSaathi** is an AI-powered coding platform designed to help developers write, debug, and optimize code in real-time. It features a built-in Monaco code editor, multi-language support, an intelligent AI tutor (powered by Google Gemini), and a production-grade backend with per-user rate limiting and exponential backoff retry mechanisms.

## 🚀 Live Demo

**https://algo-saathi.vercel.app/**

---

## ✨ Features

### Code Execution & Editor
- **Multi-Language Support:** Run C, C++, Python, Java, and JavaScript directly in the browser via JDoodle compiler API.
- **Monaco Code Editor:** VS Code-grade editing experience with syntax highlighting, IntelliSense, and `Ctrl+Enter` keyboard shortcut to run code.
- **Custom Standard Input (stdin):** Dedicated input tab for competitive programming test cases (`cin`, `input()`, `Scanner`).
- **Live Execution Telemetry:** Displays execution time (ms), compiler engine used, and retry attempt count after every run.

### AI-Powered Tutor
- **Problem Explainer:** Paste a LeetCode/Codeforces problem statement and get a simplified explanation with analogies.
- **Progressive Hints:** Receive algorithmic nudges (e.g., "Consider using a Monotonic Stack") without spoiling the solution.
- **Code Debugger:** AI analyzes your code against the problem statement and pinpoints logical errors.
- **Big-O Complexity Analyzer:** One-click Time & Space complexity estimation with bottleneck identification.

### Profile & Analytics
- **Week-Aligned Activity Heatmap:** GitHub/LeetCode-style 53-week heatmap with Sunday-aligned rows, day-of-week labels, and instant rich tooltips showing submissions, pass/fail ratio, and languages used per day.
- **Interactive Day Inspector:** Click any heatmap cell to drill into that day's submissions with 1-click "Open in Editor" action.
- **Streak Tracking:** Current streak, longest streak with date range, and acceptance rate percentage.
- **Language Mastery Breakdown:** Per-language submission and solve counts.

### Authentication
- **JWT Authentication:** Secure signup/login with hashed passwords (bcrypt).
- **Google OAuth 2.0:** One-click Google sign-in.

---

## 🏗️ Architecture & Engineering Highlights

### Resilient Code Execution Pipeline
- **Exponential Backoff with Full Jitter:** Prevents "thundering herd" retry spikes on upstream compiler services.
  ```
  delay = min(maxDelay, baseDelay × 2^attempt) × (0.5 + 0.5 × random())
  ```
- **Dynamic Timeout Scaling:** Timeout budget increases dynamically after socket timeouts or 504 Gateway errors (8s → 12s → 16s), with additional compilation buffers for compiled languages (C++: +2.5s, Java: +3s).
- **Smart Error Classification:** Distinguishes transient retryable errors (429, 5xx, ECONNABORTED) from permanent fast-fail errors (400, 401, 403). User code exit codes ≠ 0 are returned immediately without unnecessary retries.

### Per-User Rate Limiting
- In-memory sliding-window rate limiter keyed on authenticated user ID (falls back to client IP).
- Sets RFC-compliant response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.
- Configured tiers: Code Execution (20/min), AI Tutor (10/min), General API (60/min).
- Sub-microsecond per-request overhead (~0.75μs).

### Test Coverage
- **33 unit tests** (Jest) covering:
  - Rate limiter: limit enforcement, 429 on exceed, per-user isolation, IP fallback, window reset, response body format.
  - Execution service: error classification for all HTTP status codes (400–504) and network error codes (ECONNABORTED, ETIMEDOUT, etc.), backoff delay bounds verification, dynamic timeout scaling per language.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Monaco Editor, Lucide Icons |
| **Backend** | Node.js 22, Express 5, Mongoose 9 |
| **Database** | MongoDB (local dev) / MongoDB Atlas (production) |
| **AI Engine** | Google Gemini 2.5 Flash API |
| **Code Execution** | JDoodle Compiler API |
| **Authentication** | JWT (jsonwebtoken), Google OAuth 2.0 (google-auth-library) |
| **Testing** | Jest 30, Supertest |
| **Deployment** | Vercel (Frontend), Render (Backend), MongoDB Atlas |

---

## 📁 Project Structure

```
AlgoSaathi/
├── client/                          # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── profile/
│       │   │   ├── ActivityHeatmap.jsx    # Week-aligned heatmap with tooltips
│       │   │   └── DayActivityInspector.jsx  # Day drill-down panel
│       │   ├── layout/Navbar.jsx
│       │   └── ui/Button.jsx
│       ├── pages/
│       │   ├── Workspace.jsx         # Code editor + AI tutor + stdin
│       │   ├── Profile.jsx           # Dashboard with heatmap & stats
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   └── Landing.jsx
│       ├── services/                 # API client functions
│       └── context/AuthContext.jsx
│
├── server/                          # Node.js + Express backend
│   ├── controllers/
│   │   ├── runController.js          # Code execution handler
│   │   ├── userController.js         # User profile and analytics handler
│   │   ├── aiController.js           # Gemini AI tutor
│   │   └── authController.js         # JWT + Google OAuth
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT verification
│   │   └── rateLimiter.js            # Sliding-window rate limiter
│   ├── models/
│   │   ├── User.js
│   │   └── Submission.js
│   ├── routes/
│   ├── services/
│   │   └── executionService.js       # Retry engine with backoff & timeout
│   ├── scripts/
│   │   └── benchmark.js              # Performance benchmark harness
│   ├── tests/
│   │   ├── rateLimiter.test.js       # 7 tests
│   │   └── executionService.test.js  # 26 tests
│   └── index.js                      # Express server entry point
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local instance or Atlas URI)
- JDoodle API credentials ([jdoodle.com](https://www.jdoodle.com/))
- Google Gemini API key
- Google OAuth Client ID (optional, for Google sign-in)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/AlgoSaathi.git
cd AlgoSaathi

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Variables

**`server/.env`**
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/algosaathi
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
JDOODLE_CLIENT_ID=your_jdoodle_client_id
JDOODLE_CLIENT_SECRET=your_jdoodle_client_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Running Locally

```bash
# Start the backend server
cd server
npm run dev

# In a separate terminal, start the frontend
cd client
npm run dev
```

### Running Tests

```bash
cd server
npm test
```

---

## ⚠️ Known Limitations & Design Tradeoffs

1. **In-Memory Rate Limiter:**
   The rate limiter uses a `Map`-based in-memory store. This works well for single-process deployments but does **not** share state across horizontally scaled instances. In a multi-server production setup, this should be replaced with a Redis-backed store (e.g., `ioredis` + sliding window Lua script) to ensure consistent rate limiting across all server replicas.

2. **JDoodle Free Tier Quota:**
   The code execution engine relies on JDoodle's free tier, which is limited to **200 executions/day**. The per-user rate limiter helps distribute this quota fairly, but under heavy concurrent usage the daily limit can be exhausted. For production scale, upgrading to a paid JDoodle plan or self-hosting a Piston/Judge0 sandbox is recommended.

3. **No WebSocket Streaming:**
   AI responses are returned in a single JSON payload after the full Gemini generation completes. Implementing Server-Sent Events (SSE) or WebSocket streaming would provide a more responsive "typing" experience for longer AI outputs.

4. **No Persistent Session Invalidation:**
   JWT tokens are stateless with a 7-day expiry. There is no server-side token blacklist, so a compromised token cannot be revoked before expiry without adding a Redis/DB-backed invalidation layer.
