## Backend Testing Guide

### Overview

The backend uses **Jest** and **Supertest** to test the API.  
Tests are split into **unit tests** and **integration tests**.

### Project Test Structure

```text
backend/
├── test/
│   ├── setup/                    # Test infrastructure
│   │   ├── testDb.js             # In-memory MongoDB setup
│   │   └── testRedis.js          # Redis mock
│   ├── fixtures/                 # Test data factories
│   │   └── index.js              # Mock users, games, tokens, headers
│   ├── unit/                     # Unit tests
│   │   ├── models/
│   │   │   ├── User.test.js
│   │   │   └── Game.test.js
│   │   └── middlewares/
│   │       └── authMiddleware.test.js
│   └── integration/              # Integration tests
│       ├── auth.test.js
│       ├── game.test.js
│       └── user.test.js
│   ├── app.test.js               # Basic app test
│   ├── helpers.test.js           # Helper unit tests
│   └── jest.setup.cjs            # Jest global setup
├── jest.config.cjs               # Jest configuration (incl. coverage)
└── package.json                  # Test scripts
```

### Installation

From the `backend/` directory:

```bash
cd backend
npm install
```

This installs:

- **jest** – test runner
- **supertest** – HTTP testing
- **mongodb-memory-server** – in-memory MongoDB for tests

### Running Tests

From `backend/`:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm run test:coverage

# Verbose output
npm run test:verbose
```

### Test Types

**Unit tests**

- Focus on **models**, **middleware**, and **helpers** in isolation.
- Example (User model):

```javascript
import { connectTestDB, clearTestDB, disconnectTestDB } from "../setup/testDb.js";
import User from "../../src/models/User.js";

describe("User Model", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it("should create a user with valid data", async () => {
    const user = new User({ username: "test", password: "pass123" });
    const saved = await user.save();
    expect(saved.username).toBe("test");
  });
});
```

**Integration tests**

- Exercise **full request/response cycles** with Supertest.
- Example (auth login):

```javascript
import request from "supertest";
import app from "../../src/app.js";

describe("POST /api/auth/login", () => {
  it("should successfully login with correct credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "test", password: "pass123" })
      .expect(200);

    expect(response.body).toHaveProperty("token");
  });
});
```

### Test Fixtures

Located in `test/fixtures/index.js`:

- `createMockUser(overrides)`
- `createMockGame(overrides)`
- `generateTestToken(id, username?)`
- `createAuthHeaders(token)`

These help you build consistent test data and auth headers.

### Database & Redis Setup

**In-memory MongoDB** (`test/setup/testDb.js`):

- `connectTestDB()` – connect to MongoDB Memory Server
- `clearTestDB()` – clear all collections between tests
- `disconnectTestDB()` – close and stop the in-memory server

**Redis mocking** (`test/setup/testRedis.js` + `test/jest.setup.cjs`):

- `createMockRedis()` – simple in-memory Redis-like store.
- Jest setup mocks `src/config/redis.js` and `src/config/queue.js` so tests **do not require real Redis or Bull**.

### Coverage

Configured in `jest.config.cjs`:

- Coverage collected from `src/**/*.js` (excluding DB/Redis/socket wiring).
- Global targets:
  - Branches: 70%
  - Functions: 70%
  - Lines: 70%
  - Statements: 70%

Run:

```bash
npm run test:coverage
```

- Terminal shows summary.
- HTML report is written to `backend/coverage/index.html`.

### Writing New Tests

Create a new unit test file under `test/unit/`:

```javascript
import { connectTestDB, clearTestDB, disconnectTestDB } from "../setup/testDb.js";

describe("My New Feature", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it("should work correctly", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run just that file:

```bash
npm test -- test/unit/myNewFeature.test.js
```

