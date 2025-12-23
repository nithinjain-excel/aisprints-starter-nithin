# Basic Authentication - Technical PRD

## Overview

This document outlines the requirements for implementing basic authentication in the QuizMaker application. The system will provide user registration and login capabilities with role-based access (Instructor and Student) to support secure access control and user management.

**Implementation Approach**: Simple JWT-based authentication with HTTP-only cookies across 7 phases (Database → Services → API → UI → Pages → Middleware → Production).

**Scope**:
- ✅ Username/password login (email + password)
- ✅ JWT session management (HTTP-only cookies, 7-day expiration)
- ✅ Core features: register, login, logout, session validation
- ✅ Password hashing (bcrypt), role-based access (Instructor/Student)
- ❌ NO advanced features in Phase 1-7 (refresh tokens, social login, 2FA, etc.)

**Future Phases**: Phase 8 adds MCQ features; Phase 9+ adds advanced auth features if needed

---

## Business Requirements

> **Note**: For detailed authentication strategy explanation, JWT comparison, and technical decision rationale, see the "Authentication Strategy & Technical Decisions" section in Technical Implementation Details below.

### User Management

**Core Authentication Features:**
- ✅ User registration with email and password
- ✅ User login with email and password validation
- ✅ Password hashing (bcrypt)
- ✅ Simple JWT tokens for session management
- ✅ HTTP-only cookies for security
- ✅ Logout functionality
- ✅ Protected routes (redirect to login if not authenticated)
- ✅ Basic session validation

**NOT Included in Phase 1 (Future Enhancements):**
- ❌ Refresh tokens (simple 7-day expiration for now)
- ❌ Token revocation/blacklisting (just clear cookie on logout)
- ❌ "Remember me" functionality
- ❌ Social login (Google, GitHub, etc.)
- ❌ Two-factor authentication (2FA)
- ❌ Email verification
- ❌ Password reset via email
- ❌ Rate limiting on login attempts
- ❌ Account lockout after failed attempts
- ❌ Session management across multiple devices

**The "Basic Auth" Confusion Clarified:**

When we say "basic authentication," we mean:
- **Simple username/password login** (not HTTP Basic Auth with headers)
- **Essential session management** (using JWT, but keeping it simple)
- **Core security features** (password hashing, HTTP-only cookies)
- **No advanced features** for now

**Why We Still Use JWT for "Basic Auth":**

Modern web applications need session management. Without it, users would re-enter credentials on every page. JWT is the simplest approach for our serverless architecture:
- No database or Redis needed for sessions
- Works perfectly with Cloudflare Workers
- Industry standard approach
- Easy to implement
- Can be enhanced later without refactoring

### Advantages of Our Simple JWT Approach

**For Phase 1 Implementation:**
1. **Stateless**: No server-side session storage required
2. **Simple**: Just issue token on login, validate on requests
3. **Secure**: HTTP-only cookies prevent XSS attacks
4. **Cloudflare-Ready**: Works seamlessly with Workers
5. **Minimal Code**: Less than 200 lines for complete auth system
6. **Fast**: No database lookups for session validation

**Security Features (Built-in):**
- HTTP-only cookies (JavaScript cannot access tokens)
- Secure flag in production (HTTPS only)
- SameSite flag to prevent CSRF attacks
- Token expiration (7 days - user must re-login)
- Signed tokens prevent tampering
- Logout clears cookie immediately

### Quick Comparison Table

| Method | Storage | Scalability | Security | Complexity | Cloudflare-Ready | Phase 1 |
|--------|---------|-------------|----------|------------|------------------|---------|
| Traditional Sessions | Server DB/Redis | Medium | High | High | ❌ No | ❌ |
| JWT in localStorage | Client | High | Low | Low | ✅ Yes | ❌ |
| **Simple JWT in Cookies** | **Client (Cookie)** | **High** | **High** | **Low** | **✅ Yes** | **✅ Phase 1** |
| Advanced JWT Features | Client (Cookie) | High | Very High | Medium | ✅ Yes | ⏳ Phase 2 |
| OAuth/Social Login | Third-party | High | High | High | ✅ Yes | ⏳ Future |

**Legend:**
- ✅ Phase 1 = Current implementation (Phases 1-7)
- ⏳ Phase 2 = Enhanced features (Phase 9+)
- ⏳ Future = Long-term enhancements

### Comparison of Authentication Methods

#### 1. Session-Based Authentication (Traditional)
**How it works:**
- Server creates session ID, stores session data in database/memory
- Session ID sent to client as cookie
- Each request looks up session in storage

**Pros:**
- Can invalidate sessions instantly
- Server has full control
- Session data can be large

**Cons:**
- Requires session storage (database/Redis)
- Not ideal for serverless/edge computing
- Additional database query on each request
- Harder to scale horizontally

**Not chosen because:** Requires persistent session storage, which adds complexity to serverless architecture.

#### 2. JWT in Local Storage (Client-Side)
**How it works:**
- Server creates JWT token
- Client stores token in localStorage
- Client sends token in Authorization header

**Pros:**
- Easy to implement
- Works across domains (CORS)
- No cookies needed

**Cons:**
- Vulnerable to XSS attacks
- Token accessible via JavaScript
- Can't be auto-included in requests
- Less secure for web applications

**Not chosen because:** Security concerns with XSS vulnerabilities.

#### 3. Simple JWT in HTTP-Only Cookies (Our Choice for Phase 1) ✅
**How it works:**
- Server creates signed JWT token (contains userId and role)
- Server sets token in HTTP-only cookie
- Browser automatically sends cookie with each request
- Server validates token signature and expiration on protected routes
- **Keeping it simple**: No refresh tokens, no token blacklist for now

**Pros:**
- ✅ Secure (protected from XSS)
- ✅ Stateless (no session storage needed)
- ✅ Simple to implement (~200 lines of code)
- ✅ Automatic with each request
- ✅ Works perfectly with Cloudflare Workers
- ✅ Fast (no database lookup for validation)
- ✅ Industry standard approach

**Cons (and our mitigations):**
- Can't invalidate tokens before expiration → **Mitigation**: Use 7-day expiration (reasonable for web apps)
- Token size limited by cookie size → **Mitigation**: Store only userId and role (minimal payload)
- Users must re-login after 7 days → **Mitigation**: Can add "remember me" in Phase 2 if needed

**Why we chose this for Phase 1:** 
- Simplest approach that provides real security
- Perfect fit for Cloudflare Workers (serverless/edge)
- Can be enhanced later without major refactoring
- Balances security, simplicity, and performance

#### 4. OAuth 2.0 / Social Login
**How it works:**
- Delegate authentication to third-party (Google, GitHub)
- User logs in with existing account
- App receives access token

**Pros:**
- No password management
- User convenience
- Secure (managed by providers)

**Cons:**
- Requires external service setup
- Dependency on third parties
- More complex implementation
- Still need JWT/session for app

**Future consideration:** Can be added in Phase 9 alongside basic auth.

### Our Simple JWT Implementation Details (Phase 1)

**JWT Structure (Minimal Payload):**
```json
{
  "userId": "abc123def456",      // User's unique ID
  "role": "instructor",           // User's role (instructor or student)
  "iat": 1734480000,             // Issued at (Unix timestamp)
  "exp": 1735084800              // Expires at (7 days later)
}
```

**That's it!** We keep the payload minimal for simplicity and performance.

**Cookie Configuration:**
- **Name**: `session`
- **HTTP-Only**: `true` (prevents JavaScript access - secure!)
- **Secure**: `true` in production (HTTPS only)
- **SameSite**: `lax` (prevents CSRF attacks)
- **Max-Age**: 7 days (604800 seconds)
- **Path**: `/` (available throughout app)

**Token Signing (Simple):**
- **Algorithm**: HS256 (HMAC with SHA-256 - industry standard)
- **Secret**: Environment variable `SESSION_SECRET`
- **Library**: `jose` (lightweight, edge-compatible JWT library)
- **No complexity**: Just sign and verify, that's it!

**Token Validation (Fast & Simple):**
1. Read `session` cookie from request
2. Verify JWT signature using `SESSION_SECRET`
3. Check if token has expired
4. Extract `userId` and `role` from payload
5. Done! (~10ms, no database query needed)

**What We're NOT Doing (Keeping It Simple for Phase 1):**
- ❌ No refresh tokens (just re-login after 7 days)
- ❌ No token blacklist (logout just clears cookie)
- ❌ No token rotation
- ❌ No fingerprinting
- ❌ No multiple device tracking

**These can be added in Phase 2 if needed!**

### Authentication Flow Diagram

```
┌─────────────┐                                    ┌─────────────┐
│   Browser   │                                    │   Server    │
│  (Client)   │                                    │ (Cloudflare)│
└──────┬──────┘                                    └──────┬──────┘
       │                                                  │
       │  1. POST /api/auth/login                       │
       │     { email, password }                        │
       ├───────────────────────────────────────────────>│
       │                                                  │
       │                    2. Validate credentials     │
       │                       Hash comparison          │
       │                       Query database           │
       │                                                  │
       │                    3. Create JWT token         │
       │                       Sign with secret         │
       │                       Include userId, role     │
       │                                                  │
       │  4. Set-Cookie: session=[JWT]                  │
       │     HttpOnly, Secure, SameSite                 │
       │<─────────────────────────────────────────────┤
       │                                                  │
       │  5. GET / (Home Page)                          │
       │     Cookie: session=[JWT]                      │
       ├───────────────────────────────────────────────>│
       │                                                  │
       │                    6. Middleware validates JWT │
       │                       Verify signature         │
       │                       Check expiration         │
       │                       Extract user data        │
       │                                                  │
       │  7. Return protected content                   │
       │<─────────────────────────────────────────────┤
       │                                                  │
       │  8. POST /api/auth/logout                      │
       │     Cookie: session=[JWT]                      │
       ├───────────────────────────────────────────────>│
       │                                                  │
       │  9. Clear-Cookie: session                      │
       │<─────────────────────────────────────────────┤
       │                                                  │
```

### Token Lifecycle

1. **Login/Registration:**
   - User submits credentials via form
   - Server validates credentials against database
   - Server verifies password hash using bcrypt
   - Server creates JWT with userId and role as payload
   - Server signs JWT with SESSION_SECRET (HS256 algorithm)
   - Server sets JWT in HTTP-only cookie with security flags
   - Client redirected to home page
   - **Duration**: ~500ms

2. **Authenticated Requests:**
   - Browser automatically sends cookie with every request
   - Middleware intercepts request
   - Middleware reads session cookie
   - Middleware validates JWT signature using SESSION_SECRET
   - Middleware checks expiration timestamp
   - If valid, extracts userId and role from payload
   - Request proceeds with user context available
   - **Duration**: ~10ms (no database query needed)

3. **Logout:**
   - User clicks logout button
   - Client sends POST to /api/auth/logout
   - Server clears cookie (sets Max-Age to 0)
   - Server responds with success
   - Client redirected to login page
   - Token becomes invalid (removed from browser)
   - **Duration**: ~100ms

4. **Token Expiration:**
   - After 7 days, token expires automatically
   - Next request fails validation (expired token)
   - User redirected to login page with message
   - User must login again to get new token
   - **Graceful handling**: No errors shown, just re-login prompt

### Security Considerations

**Protection Against Common Attacks:**

1. **XSS (Cross-Site Scripting):**
   - HTTP-only cookies prevent JavaScript access
   - Input sanitization and validation
   - Content Security Policy headers

2. **CSRF (Cross-Site Request Forgery):**
   - SameSite cookie attribute
   - Origin validation on sensitive operations

3. **Token Theft:**
   - HTTPS only in production
   - Short token expiration
   - Secure cookie flags

4. **Brute Force:**
   - Password complexity requirements
   - Rate limiting (future phase)
   - Account lockout (future phase)

5. **SQL Injection:**
   - Parameterized queries (via d1-client)
   - Input validation
   - Never concatenate SQL

### Frequently Asked Questions

**Q: I wanted "basic authentication" first, not JWT. Why are we using JWT?**
A: Great question! When we say "basic authentication," we mean simple username/password login. However, even basic auth needs **session management** - otherwise users would re-enter credentials on every page!

JWT is actually the **simplest** way to handle sessions in modern web apps:
- **No database needed** for session storage (perfect for serverless)
- **Just 3 files** of code (~200 lines total)
- **Industry standard** - same approach used by most modern apps
- **Simple Phase 1 implementation** - no refresh tokens or complex features
- **Can't be simpler** without making users re-login on every page

Think of it this way: JWT is HOW we implement the session for basic authentication. It's not "advanced auth" - it's just the modern, simple way to remember that a user is logged in.

**Q: Can we implement even simpler authentication without JWT?**
A: Not really, not for a modern web app. Your options are:
1. **JWT in cookies** (our choice - simple, secure, stateless)
2. **Traditional sessions** (requires Redis/database - more complex)
3. **No sessions** (user re-enters password on every page - bad UX)

JWT in cookies is actually the simplest modern approach. The "advanced" part comes later (refresh tokens, revocation, etc.) - we're not doing those in Phase 1.

**Q: Why not use traditional session-based authentication?**
A: Traditional sessions require server-side storage (database or Redis), which adds complexity to serverless/edge deployments. JWT with HTTP-only cookies provides security similar to sessions but works better with Cloudflare Workers' stateless architecture. Also, JWT is actually simpler to implement than traditional sessions!

**Q: Why not store JWT in localStorage?**
A: LocalStorage is accessible via JavaScript, making it vulnerable to XSS attacks. HTTP-only cookies cannot be accessed by JavaScript, providing better security. Additionally, cookies are automatically sent with requests, simplifying the implementation.

**Q: Can we invalidate JWT tokens before expiration?**
A: Not directly, since JWT is stateless. However, we can implement a token blacklist in the database for critical operations (like forced logout). For now, we rely on short expiration times (7 days) and logout clearing the cookie. Token revocation can be added in Phase 9 if needed.

**Q: What happens if SESSION_SECRET is compromised?**
A: If the secret is compromised, attackers could forge tokens. To mitigate:
- Keep SESSION_SECRET in environment variables (never in code)
- Use a strong, random secret (minimum 32 characters)
- Rotate secrets periodically in production
- Monitor for suspicious activity
- If compromised, rotate the secret (all users will need to re-login)

**Q: Why 7 days expiration? Can we make it longer?**
A: 7 days balances security and convenience:
- Too short (1 day): Users login too often, poor UX
- Too long (30 days): Higher risk if token is stolen
- 7 days: Industry standard for web apps
- Can be adjusted based on security requirements
- "Remember me" feature can be added later for longer sessions

**Q: How does this work with Cloudflare Workers?**
A: Perfect fit! Cloudflare Workers are stateless and run at the edge:
- JWT validation happens at the edge (fast)
- No central session storage needed
- Works globally with Cloudflare's network
- jose library is edge-compatible
- Minimal latency for auth checks

**Q: Can we use this with mobile apps?**
A: Yes, but with modifications:
- Mobile apps can store JWT in secure storage (not cookies)
- Send token in Authorization header
- Same JWT validation logic on server
- May need CORS configuration
- Current implementation is web-focused

**Q: What about refresh tokens?**
A: Not needed for our use case:
- 7-day expiration is reasonable for web apps
- Adding refresh tokens adds complexity
- Can be added in Phase 9 if needed for:
  - Longer-lived sessions
  - Token revocation capabilities
  - More granular security controls

---

## Business Requirements

### User Management
- New users can self-register with either Instructor or Student role
- Users can login using their email address and password
- System must validate user credentials during login
- Users must be able to select their role during registration
- Email addresses must be unique across the system

### Security Requirements
- Passwords must meet complexity requirements (8+ characters, alphanumeric with special characters)
- Passwords must be securely hashed before storage
- System must prevent duplicate user registrations with the same email
- Session management must maintain user authentication state after login
- Login attempts must be validated against stored credentials

### User Experience Requirements
- Login page must be the first page users see when accessing the application
- Registration page must be accessible from the login page
- Form validation must provide clear error messages to users
- Successful login must redirect users to a placeholder home page showing welcome message
- Successful registration must allow immediate login
- Home page is a simple placeholder for both roles (MCQ features will be added in Phase 8)
- Users can logout from home page to return to login screen

---

## Technical Requirements

### Database Schema

```sql
-- Users table to store authentication and profile information
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  role TEXT NOT NULL CHECK(role IN ('instructor', 'student')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups during login
CREATE INDEX idx_users_email ON users(email);

-- Index for role-based queries
CREATE INDEX idx_users_role ON users(role);
```

### API Endpoints

#### POST /api/auth/register

**Description**: Register a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "instructor"
}
```

**Validation Rules:**
- `firstName`: Required, minimum 2 characters
- `lastName`: Optional
- `email`: Required, must be valid email format, must be unique
- `password`: Required, minimum 8 characters, must contain at least 1 uppercase letter, 1 number, and 1 special character
- `role`: Required, must be either "instructor" or "student"

**Response:**
- Success (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "abc123def456",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "instructor"
  }
}
```

- Error (400): Validation error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

- Error (409): Email already exists
```json
{
  "success": false,
  "error": "Email already registered"
}
```

- Error (500): Server error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

#### POST /api/auth/login

**Description**: Authenticate user and create session

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Validation Rules:**
- `email`: Required, must be valid email format
- `password`: Required

**Response:**
- Success (200):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "abc123def456",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "instructor"
  }
}
```

- Error (401): Invalid credentials
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

- Error (500): Server error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

#### POST /api/auth/logout

**Description**: End user session

**Response:**
- Success (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/auth/session

**Description**: Get current authenticated user information

**Response:**
- Success (200):
```json
{
  "success": true,
  "user": {
    "id": "abc123def456",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "instructor"
  }
}
```

- Error (401): Not authenticated
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

### User Interface Requirements

#### Login Page (`/login`)

**Components:**
- Email input field (shadcn Input component)
- Password input field (shadcn Input component with type="password")
- "Login" button (shadcn Button component)
- "Don't have an account? Register" link (shadcn Link or Button variant)
- Error message display area

**Validation:**
- Email: Required, must be valid email format
- Password: Required

**User Actions:**
- Click "Login" button to submit credentials
- Click "Register" link to navigate to registration page
- Form validation triggers on submit
- Display error message if login fails
- Redirect to home page (/) on successful login

**Error Handling:**
- Display inline validation errors below each field
- Display authentication error message if credentials are invalid
- Show loading state on button during API call

#### Registration Page (`/register`)

**Components:**
- First Name input field (shadcn Input component)
- Last Name input field (shadcn Input component)
- Email input field (shadcn Input component)
- Password input field (shadcn Input component with type="password")
- Role selection (shadcn RadioGroup component with two options: "Instructor" and "Student")
- "Register" button (shadcn Button component)
- "Already have an account? Login" link (shadcn Link or Button variant)
- Password requirements helper text
- Error message display area

**Validation Rules:**
- First Name:
  - Required field
  - Minimum 2 characters
  - Error message: "First name must be at least 2 characters"
  
- Last Name:
  - Optional field
  
- Email:
  - Required field
  - Valid email format (standard email regex)
  - Error message: "Please enter a valid email address"
  - Unique check on backend
  
- Password:
  - Required field
  - Minimum 8 characters
  - Must contain at least one uppercase letter (A-Z)
  - Must contain at least one lowercase letter (a-z)
  - Must contain at least one number (0-9)
  - Must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
  - Error messages:
    - "Password must be at least 8 characters long"
    - "Password must contain at least one uppercase letter"
    - "Password must contain at least one number"
    - "Password must contain at least one special character"
  
- Role:
  - Required field (radio button selection)
  - Options: "Instructor" or "Student"
  - Default: None selected (user must choose)

**User Actions:**
- Fill out registration form
- Select role via radio buttons
- Click "Register" button to submit
- Click "Login" link to navigate to login page
- Form validation triggers on submit
- Display success message and redirect to login page on successful registration

**Error Handling:**
- Display inline validation errors below each field
- Display server error message if registration fails
- Show loading state on button during API call
- Handle duplicate email error gracefully

**Password Requirements Display:**
Show helper text below password field:
```
Password must contain:
✓ At least 8 characters
✓ One uppercase letter
✓ One lowercase letter
✓ One number
✓ One special character
```
(Update checkmarks dynamically as user types)

#### Home Page (`/`)

**Components:**
- Protected route (requires authentication)
- Welcome message with user's first name and last name
- Display user role (Instructor or Student)
- Placeholder message: "Welcome to QuizMaker! MCQ features coming soon..."
- Simple card layout (shadcn Card component)
- Logout button (shadcn Button component)
- User info section showing email and role

**Layout:**
```
┌─────────────────────────────────────┐
│ QuizMaker                  [Logout] │
├─────────────────────────────────────┤
│                                     │
│   Welcome back, [First Last]!      │
│                                     │
│   Role: [Instructor/Student]       │
│   Email: [user@example.com]        │
│                                     │
│   ┌───────────────────────────┐   │
│   │ Welcome to QuizMaker!      │   │
│   │                            │   │
│   │ MCQ features coming soon:  │   │
│   │ • Quiz authoring (for      │   │
│   │   instructors)             │   │
│   │ • Quiz taking (for         │   │
│   │   students)                │   │
│   └───────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**User Actions:**
- Click logout button to end session and return to login page

**Note:**
- This is a temporary placeholder page for both Instructor and Student roles
- Both roles see the same page initially
- Will be enhanced in Phase 8 with:
  - MCQ authoring interface for Instructors
  - MCQ quiz taking interface for Students
  - Different content based on user role

---

## Implementation Phases

**Implementation Philosophy**: Each phase is designed to be independently developable, deployable, and testable. Phases build on each other in a logical order: Database → Backend Services → API Layer → UI Components → Pages → Integration.

### Phase Dependency Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     IMPLEMENTATION FLOW                         │
└────────────────────────────────────────────────────────────────┘

Phase 1: Database Foundation
├─ Create migration SQL files
├─ Apply to local D1 database
├─ Verify tables and constraints
└─ ✅ Deployable & Testable (via wrangler CLI)
      │
      ├─────> Test: Query tables, test constraints
      └─────> Deploy: wrangler d1 migrations apply
                  │
                  ▼
Phase 2: Core Backend Services
├─ Install packages (bcryptjs, jose, zod)
├─ Create password utilities
├─ Create JWT session utilities
├─ Create validation schemas
└─ ✅ Deployable & Testable (unit tests)
      │
      ├─────> Test: npm test (unit tests)
      └─────> Deploy: npm install
                  │
                  ▼
Phase 3: API Endpoints Layer
├─ Create /api/auth/register
├─ Create /api/auth/login
├─ Create /api/auth/logout
├─ Create /api/auth/session
└─ ✅ Deployable & Testable (HTTP requests)
      │
      ├─────> Test: curl/Postman requests
      └─────> Deploy: npm run dev
                  │
                  ▼
Phase 4: UI Components Library
├─ Install shadcn components
├─ Install react-hook-form
├─ Create LoginForm component
├─ Create RegistrationForm component
└─ ✅ Deployable & Testable (component isolation)
      │
      ├─────> Test: Component rendering, validation
      └─────> Deploy: Part of npm run dev
                  │
                  ▼
Phase 5: Authentication Pages
├─ Create /login page
├─ Create /register page
├─ Create / (home) page
└─ ✅ Deployable & Testable (browser testing)
      │
      ├─────> Test: Manual browser flows
      └─────> Deploy: Part of npm run dev
                  │
                  ▼
Phase 6: Middleware & Session
├─ Create middleware.ts
├─ Implement route protection
├─ Handle session validation
└─ ✅ Deployable & Testable (route protection)
      │
      ├─────> Test: Protected route access
      └─────> Deploy: Automatic with application
                  │
                  ▼
Phase 7: E2E Testing & Production
├─ Comprehensive testing
├─ Security audit
├─ Production deployment
└─ ✅ Deployable to Production
      │
      ├─────> Test: All flows in production
      └─────> Deploy: npm run deploy (Cloudflare)
                  │
                  ▼
          ✅ AUTHENTICATION COMPLETE
          Ready for Phase 8 (MCQ Features)
```

### Phase Independence & Testing

Each phase can be worked on, deployed, and tested independently:

| Phase | Depends On | Can Test Independently? | How to Test | Deploy Command |
|-------|-----------|------------------------|-------------|----------------|
| 1. Database | None | ✅ Yes | wrangler CLI queries | `wrangler d1 migrations apply` |
| 2. Services | Phase 1 | ✅ Yes | Unit tests (npm test) | `npm install` |
| 3. API Endpoints | Phases 1, 2 | ✅ Yes | curl/Postman | `npm run dev` |
| 4. UI Components | Phase 3 (for API calls) | ✅ Yes | Component tests | Part of `npm run dev` |
| 5. Pages | Phases 3, 4 | ✅ Yes | Browser testing | Part of `npm run dev` |
| 6. Middleware | Phases 1-5 | ✅ Yes | Route protection tests | Automatic |
| 7. E2E & Prod | Phases 1-6 | ✅ Yes | Full flow tests | `npm run deploy` |

---

### Phase 1: Database Foundation

**Objective**: Set up the database schema and verify it works correctly

**Why This First**: Database is the foundation. Without it, nothing else can work. This phase ensures data persistence is ready.

**Tasks**:
1. Install wrangler CLI (if not already)
2. Create D1 database migration file for users table
3. Add indexes for email and role columns for performance
4. Apply migration to local D1 database
5. Test migration rollback (if needed)
6. Verify table structure with wrangler commands
7. Document database schema in PRD

**Deliverables**:
- `migrations/0001_create_users_table.sql` - SQL migration file
- Migration applied successfully to local database
- Database verified with test queries
- Schema documented

**How to Deploy**:
```bash
# Apply migration locally
npx wrangler d1 migrations apply quizmaker-database --local

# Verify table creation
npx wrangler d1 execute quizmaker-database --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# Test insert (will fail due to constraints - that's expected)
npx wrangler d1 execute quizmaker-database --local --command="INSERT INTO users (email, password_hash, first_name, role) VALUES ('test@test.com', 'hash', 'Test', 'student');"
```

**How to Test**:
```bash
# 1. Verify users table exists
npx wrangler d1 execute quizmaker-database --local --command="PRAGMA table_info(users);"

# 2. Verify indexes exist
npx wrangler d1 execute quizmaker-database --local --command="SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='users';"

# 3. Test UNIQUE constraint on email
npx wrangler d1 execute quizmaker-database --local --command="INSERT INTO users (email, password_hash, first_name, role) VALUES ('test@test.com', 'hash', 'Test', 'student'); INSERT INTO users (email, password_hash, first_name, role) VALUES ('test@test.com', 'hash2', 'Test2', 'instructor');"
# Should fail on second insert (UNIQUE constraint violation)

# 4. Test role CHECK constraint
npx wrangler d1 execute quizmaker-database --local --command="INSERT INTO users (email, password_hash, first_name, role) VALUES ('test2@test.com', 'hash', 'Test', 'admin');"
# Should fail (invalid role)
```

**Success Criteria**:
- [x] Migration file created
- [x] Migration applies without errors
- [x] Users table exists with all columns
- [x] Indexes created on email and role
- [x] UNIQUE constraint on email works
- [x] CHECK constraint on role works
- [x] Can query the table successfully

**Expected Deliverables**:
- Migration file created and tested
- Database schema verified
- Constraints working correctly
- Ready for Phase 2 development

---

### Phase 2: Core Backend Services

**Objective**: Build the business logic layer for authentication (password hashing, validation, user creation)

**Why This Second**: Services contain the core logic. They need the database (Phase 1) but don't need API routes yet. Can be tested independently with unit tests.

**Tasks**:
1. Install required packages: bcryptjs, jose, zod
2. Create password hashing utilities (bcrypt)
3. Create password validation utilities
4. Create JWT session management utilities
5. Create validation schemas with Zod
6. Create authentication service (register, login, verify)
7. Write comprehensive unit tests for all services
8. Test with mock data

**Deliverables**:
- `lib/utils/password.ts` - Password hashing and verification
- `lib/utils/session.ts` - JWT creation and validation
- `lib/validation/auth-schemas.ts` - Zod validation schemas
- `lib/services/auth-service.ts` - Core authentication business logic
- `lib/services/auth-service.test.ts` - Unit tests
- All tests passing

**How to Deploy**:
```bash
# Install dependencies
npm install bcryptjs @types/bcryptjs jose zod

# Set up SESSION_SECRET in .dev.vars
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .dev.vars

# Run tests
npm test -- lib/services/auth-service.test.ts
```

**How to Test**:
```bash
# Run unit tests
npm test

# Test password hashing
# In test file, verify:
# - hashPassword returns different hash each time (salt)
# - verifyPassword returns true for correct password
# - verifyPassword returns false for wrong password

# Test JWT creation/validation
# In test file, verify:
# - createSession creates valid JWT
# - getSession extracts correct payload
# - Expired tokens are rejected
# - Invalid signatures are rejected

# Test validation schemas
# In test file, verify:
# - Valid data passes validation
# - Invalid email format fails
# - Weak passwords fail
# - Missing required fields fail
```

**Success Criteria**:
- [ ] All packages installed
- [ ] Password hashing works correctly
- [ ] Password verification works correctly
- [ ] JWT tokens created successfully
- [ ] JWT tokens validated successfully
- [ ] Expired tokens rejected
- [ ] Validation schemas work correctly
- [ ] All unit tests pass (100% coverage for services)
- [ ] No security vulnerabilities in dependencies

---

### Phase 3: API Endpoints Layer

**Objective**: Create RESTful API endpoints that use the backend services

**Why This Third**: APIs sit on top of services. They need both database (Phase 1) and services (Phase 2). Can be tested independently with HTTP requests and automated integration tests.

**Tasks**:
1. Create POST /api/auth/register endpoint
2. Create POST /api/auth/login endpoint
3. Create POST /api/auth/logout endpoint
4. Create GET /api/auth/session endpoint
5. Implement error handling for all endpoints
6. Add proper HTTP status codes
7. Implement request validation
8. Create comprehensive integration tests for all endpoints
9. Test endpoints with curl/Postman/REST client (optional, automated tests cover all scenarios)

**Deliverables**:
- `app/api/auth/register/route.ts` - User registration endpoint
- `app/api/auth/login/route.ts` - User login endpoint
- `app/api/auth/logout/route.ts` - User logout endpoint
- `app/api/auth/session/route.ts` - Session verification endpoint
- `lib/utils/cookies.ts` - Cookie management utilities
- `app/api/auth/register/route.test.ts` - Integration tests (11 tests)
- `app/api/auth/login/route.test.ts` - Integration tests (13 tests)
- `app/api/auth/logout/route.test.ts` - Integration tests (7 tests)
- `app/api/auth/session/route.test.ts` - Integration tests (12 tests)
- `docs/api_testing_guide.md` - Manual API testing guide
- `docs/phase3_summary.md` - Phase 3 summary document
- `docs/phase3_integration_tests_summary.md` - Integration test coverage report
- All endpoints tested and working (43 integration tests passing)

**How to Deploy**:
```bash
# Start dev server
npm run dev

# Endpoints will be available at:
# POST http://localhost:3000/api/auth/register
# POST http://localhost:3000/api/auth/login
# POST http://localhost:3000/api/auth/logout
# GET http://localhost:3000/api/auth/session
```

**How to Test**:

**Automated Integration Tests (Recommended):**
```bash
# Run all API integration tests
npm test -- --run app/api/auth

# Expected: All 43 tests pass
# - Register endpoint: 11 tests
# - Login endpoint: 13 tests
# - Logout endpoint: 7 tests
# - Session endpoint: 12 tests

# Run specific endpoint tests
npm test -- --run app/api/auth/register  # 11 tests
npm test -- --run app/api/auth/login     # 13 tests
npm test -- --run app/api/auth/logout    # 7 tests
npm test -- --run app/api/auth/session   # 12 tests
```

**Manual Testing with curl (Optional):**
```bash
# Test Registration Endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@test.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "instructor"
  }'
# Expected: 201 Created with user object

# Test duplicate email
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@test.com",
    "password": "SecurePass123!",
    "firstName": "Jane",
    "role": "student"
  }'
# Expected: 409 Conflict (email already exists)

# Test Login Endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@test.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt
# Expected: 200 OK with user object and Set-Cookie header

# Test Session Endpoint (with cookie)
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt
# Expected: 200 OK with user object

# Test Logout Endpoint
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
# Expected: 200 OK and cookie cleared

# Test Session After Logout
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt
# Expected: 401 Unauthorized
```

**Test Coverage Summary:**
- ✅ **43 Integration Tests** covering all API endpoints
- ✅ Success scenarios (registration, login, logout, session validation)
- ✅ Validation errors (missing fields, invalid formats, weak passwords)
- ✅ Authentication errors (invalid credentials, no session, expired tokens)
- ✅ Server errors (database failures, session errors, cookie errors)
- ✅ Security checks (password not leaked, duplicate email handling)
- ✅ Edge cases (idempotency, email case handling, error recovery)

For detailed test documentation, see: `docs/phase3_integration_tests_summary.md`

**Success Criteria**:
- [x] All endpoints created
- [x] Registration endpoint works with valid data
- [x] Registration rejects duplicate emails (409)
- [x] Registration validates password requirements
- [x] Login endpoint authenticates correctly
- [x] Login sets HTTP-only cookie
- [x] Login rejects invalid credentials (401)
- [x] Session endpoint returns user data when authenticated
- [x] Session endpoint returns 401 when not authenticated
- [x] Logout endpoint clears cookie
- [x] All error responses have consistent format
- [x] All endpoints handle edge cases gracefully
- [x] **Integration tests created (43 tests total)**
- [x] Register endpoint tests (11 tests) - all passing
- [x] Login endpoint tests (13 tests) - all passing
- [x] Logout endpoint tests (7 tests) - all passing
- [x] Session endpoint tests (12 tests) - all passing
- [x] All validation scenarios covered
- [x] All error scenarios covered
- [x] Security checks verified (no password leaks)
- [x] Fixed Zod error handling (error.issues)

**Expected Deliverables**:
- All API endpoints created and tested
- Integration tests written
- Comprehensive test coverage
- Ready for Phase 4 UI development

---

### Phase 4: UI Components Library

**Objective**: Build reusable React components for authentication UI

**Why This Fourth**: UI components need the API endpoints (Phase 3) to be functional but can be developed in isolation with mocked API calls.

**Tasks**:
1. Install shadcn/ui components (Button, Input, Form, Card, Label, RadioGroup)
2. Install react-hook-form and @hookform/resolvers
3. Create LoginForm component with validation
4. Create RegistrationForm component with validation
5. Create PasswordStrength indicator component
6. Add loading states for form submissions
7. Add error message display components
8. Test components in Storybook or isolation

**Deliverables**:
- `components/auth/LoginForm.tsx` - Login form with validation
- `components/auth/RegistrationForm.tsx` - Registration form with validation
- `components/auth/PasswordStrength.tsx` - Password requirements indicator
- `components/ui/*` - shadcn/ui components
- Components tested in isolation

**How to Deploy**:
```bash
# Install shadcn/ui components
npx shadcn@latest add button input label card form

# Install react-hook-form
npm install react-hook-form @hookform/resolvers

# Components will be imported into pages (Phase 5)
```

**How to Test**:
```bash
# Create a test page to render components in isolation
# app/test/components/page.tsx

# Test LoginForm:
# 1. Renders email and password fields
# 2. Shows validation errors for empty fields
# 3. Shows validation errors for invalid email
# 4. Shows loading state on submit
# 5. Calls onSubmit with form data
# 6. Shows API error messages

# Test RegistrationForm:
# 1. Renders all fields (firstName, lastName, email, password, role)
# 2. Shows validation errors for empty required fields
# 3. Shows password strength indicator
# 4. Updates password requirements in real-time
# 5. Shows validation errors for weak passwords
# 6. Role radio buttons work correctly
# 7. Shows loading state on submit
# 8. Calls onSubmit with form data

# Test PasswordStrength:
# 1. Shows all requirements (length, uppercase, number, special char)
# 2. Updates checkmarks as user types
# 3. Visual feedback (colors) for met/unmet requirements
```

**Success Criteria**:
- [ ] All shadcn/ui components installed
- [ ] LoginForm renders correctly
- [ ] LoginForm validates email format
- [ ] LoginForm validates required fields
- [ ] RegistrationForm renders all fields
- [ ] RegistrationForm validates all fields
- [ ] RegistrationForm shows password strength
- [ ] Password strength indicator updates in real-time
- [ ] All forms show loading states
- [ ] All forms display error messages
- [ ] Forms are responsive (mobile-friendly)
- [ ] Forms are accessible (ARIA labels, keyboard navigation)

---

### Phase 5: Authentication Pages

**Objective**: Create full pages that integrate components with API endpoints

**Why This Fifth**: Pages tie everything together. They need UI components (Phase 4) and API endpoints (Phase 3) to be complete.

**Tasks**:
1. Create login page at /login route
2. Create registration page at /register route
3. Create placeholder home page at / route (protected)
4. Implement navigation between login and registration
5. Add redirect logic after successful authentication
6. Create middleware for route protection
7. Test complete user flows

**Deliverables**:
- `app/login/page.tsx` - Login page
- `app/register/page.tsx` - Registration page
- `app/page.tsx` - Protected home page (placeholder)
- `middleware.ts` - Route protection middleware
- Complete user flows working

**How to Deploy**:
```bash
# Already deployed with dev server from Phase 3
# Pages will be available at:
# http://localhost:3000/login
# http://localhost:3000/register
# http://localhost:3000/ (redirects to /login if not authenticated)

# Later, deploy to Cloudflare:
npm run deploy
```

**How to Test**:
```bash
# Manual Testing Flow:

# 1. Test Registration Flow
# - Navigate to http://localhost:3000/login
# - Should see login page
# - Click "Register" link
# - Should navigate to /register
# - Fill form with invalid data (weak password)
# - Should see validation errors
# - Fill form with valid data
# - Click "Register"
# - Should see success message
# - Should redirect to /login

# 2. Test Login Flow
# - Navigate to http://localhost:3000/login
# - Fill form with wrong password
# - Click "Login"
# - Should see "Invalid credentials" error
# - Fill form with correct credentials
# - Click "Login"
# - Should redirect to / (home page)
# - Should see welcome message with user's name

# 3. Test Protected Route
# - Open incognito window
# - Navigate to http://localhost:3000/
# - Should redirect to /login
# - Login with valid credentials
# - Should show home page

# 4. Test Session Persistence
# - Login successfully
# - Refresh page
# - Should still be logged in (not redirected)
# - Should see home page

# 5. Test Logout
# - From home page, click "Logout"
# - Should redirect to /login
# - Session cookie should be cleared
# - Navigate to /
# - Should redirect to /login

# 6. Test Duplicate Registration
# - Try to register with existing email
# - Should show "Email already registered" error
```

**Success Criteria**:
- [ ] Login page renders correctly
- [ ] Registration page renders correctly
- [ ] Home page renders when authenticated
- [ ] Unauthenticated users redirected to /login
- [ ] Registration flow works end-to-end
- [ ] Login flow works end-to-end
- [ ] Logout flow works end-to-end
- [ ] Session persists across page reloads
- [ ] Middleware protects routes correctly
- [ ] Navigation between pages works
- [ ] Error messages display correctly
- [ ] Loading states work correctly
- [ ] Mobile responsive design works

---

### Phase 6: Middleware & Session Management

**Objective**: Implement robust session validation and route protection

**Why This Sixth**: Middleware enhances the pages (Phase 5) with automatic session management and route protection.

**Tasks**:
1. Create Next.js middleware for session validation
2. Implement automatic session checks on protected routes
3. Handle session expiration gracefully
4. Implement redirect logic for unauthenticated users
5. Add session refresh if needed
6. Test middleware with various scenarios

**Deliverables**:
- `middleware.ts` - Session validation middleware
- `lib/auth/middleware-helpers.ts` - Helper functions
- Automatic route protection working
- Session management fully functional

**How to Deploy**:
```bash
# Middleware is automatically deployed with the application
# No separate deployment needed
```

**How to Test**:
```bash
# Test Middleware Scenarios:

# 1. Test Protected Route Access (Not Authenticated)
curl -X GET http://localhost:3000/ -i
# Expected: 302 Redirect to /login

# 2. Test Protected Route Access (Authenticated)
# First login to get cookie
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"SecurePass123!"}' \
  -c cookies.txt

# Then access protected route
curl -X GET http://localhost:3000/ -b cookies.txt -i
# Expected: 200 OK with home page HTML

# 3. Test Session Expiration
# Manually create expired token and test
# Should redirect to login with message

# 4. Test Public Route Access
curl -X GET http://localhost:3000/login -i
# Expected: 200 OK (no redirect)

# 5. Test Authenticated User Accessing Login Page
curl -X GET http://localhost:3000/login -b cookies.txt -i
# Expected: 302 Redirect to / (home page)
```

**Success Criteria**:
- [ ] Middleware validates sessions automatically
- [ ] Protected routes require authentication
- [ ] Unauthenticated users redirected to /login
- [ ] Authenticated users redirected from /login to /
- [ ] Session expiration handled gracefully
- [ ] Invalid tokens rejected
- [ ] Public routes accessible without authentication
- [ ] Middleware performance is good (<10ms)

---

### Phase 7: End-to-End Testing & Deployment

**Objective**: Comprehensive testing and production deployment

**Why This Last**: Final phase ensures everything works together correctly before deploying to production.

**Tasks**:
1. Create comprehensive test suite
2. Test all user flows end-to-end
3. Test edge cases and error scenarios
4. Perform security audit
5. Test on different browsers
6. Test on mobile devices
7. Deploy to Cloudflare Workers
8. Test production environment
9. Update documentation

**Deliverables**:
- Complete test suite passing
- Security audit completed
- Application deployed to production
- Documentation updated
- Ready for Phase 8 (MCQ features)

**How to Deploy to Production**:
```bash
# 1. Ensure all tests pass
npm test

# 2. Set production SESSION_SECRET
npx wrangler secret put SESSION_SECRET
# Enter a strong, random secret (32+ characters)

# 3. Apply database migration to production
npx wrangler d1 migrations apply quizmaker-database --remote

# 4. Build and deploy
npm run deploy

# 5. Verify deployment
curl -X GET https://aisprints-starter.nithinjain.workers.dev/login -i
# Should return 200 OK
```

**How to Test Production**:
```bash
# Test Production Registration
curl -X POST https://aisprints-starter.nithinjain.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prod-test@test.com",
    "password": "SecurePass123!",
    "firstName": "Production",
    "lastName": "Test",
    "role": "instructor"
  }'

# Test Production Login
curl -X POST https://aisprints-starter.nithinjain.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prod-test@test.com",
    "password": "SecurePass123!"
  }' \
  -c prod-cookies.txt -i

# Test Production Protected Route
curl -X GET https://aisprints-starter.nithinjain.workers.dev/ \
  -b prod-cookies.txt -i
```

**Success Criteria**:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All user flows work correctly
- [ ] Edge cases handled properly
- [ ] Security audit shows no critical issues
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Works on mobile browsers (iOS Safari, Chrome Android)
- [ ] Production deployment successful
- [ ] Production environment fully functional
- [ ] Session management works in production
- [ ] Database migrations applied to production
- [ ] All API endpoints respond correctly in production
- [ ] Performance is acceptable (<2s page loads)
- [ ] No console errors on any page
- [ ] Documentation updated with production URLs

---

## Testing Strategy

### Overview

This authentication system should follow a comprehensive testing approach with multiple layers of automated tests to ensure reliability, security, and correctness at every level.

### Testing Pyramid

```
                 ┌─────────────────┐
                 │   E2E Tests     │  ← Phase 7
                 │   (Browser)     │
                 └─────────────────┘
                         │
              ┌──────────────────────┐
              │  Integration Tests   │  ← Phase 3
              │   (API Endpoints)    │
              └──────────────────────┘
                         │
         ┌────────────────────────────────┐
         │      Unit Tests                │  ← Phase 2
         │  (Services & Utilities)        │
         └────────────────────────────────┘
```

### Required Test Coverage

#### Phase 2: Unit Tests
**Purpose**: Test individual functions and services in isolation

**Required Coverage**:
- Password hashing and verification utilities
- JWT token creation and verification
- Session management utilities
- Authentication service business logic
- Validation schemas
- Edge cases and error scenarios

**Technologies**: Vitest, mocked dependencies

#### Phase 3: Integration Tests
**Purpose**: Test API endpoints with mocked external dependencies

**Required Coverage**:
- All API endpoints (register, login, logout, session)
- Success scenarios for each endpoint
- Validation error handling
- Authentication error scenarios
- Server error handling
- Security checks (no password leaks)
- HTTP status codes and response formats

**Technologies**: Vitest, mocked services

#### Phase 7: E2E Tests
**Purpose**: Test complete user flows in browser

**Required Coverage**:
- Complete registration flow
- Complete login flow
- Complete logout flow
- Session persistence across page reloads
- Protected route access
- Mobile responsiveness
- Cross-browser compatibility

**Technologies**: Playwright or Cypress

### Test Execution Commands

**Run All Tests**:
```bash
npm test
```

**Run Specific Test Suite**:
```bash
npm test -- lib/              # Unit tests
npm test -- app/api/auth      # Integration tests
```

**Watch Mode**:
```bash
npm test -- --watch
```

### Quality Requirements

- **Test Pass Rate**: 100% of tests should pass before deployment
- **Code Coverage**: Focus on critical paths (auth, session, validation)
- **Test Execution Time**: All tests should complete in under 10 seconds
- **Mocking Strategy**: Mock external dependencies, test business logic

### Testing Best Practices

1. Write tests as you implement features
2. Test both success and failure scenarios
3. Mock external dependencies appropriately
4. Keep tests fast and isolated
5. Use descriptive test names
6. Document test purposes clearly

---

## Technical Implementation Details

### Key Files

**Database:**
- `migrations/0001_create_users_table.sql` - Initial database schema
- `lib/d1-client.ts` - Database client utilities

**Backend Services:**
- `lib/services/auth-service.ts` - Authentication business logic
- `lib/utils/password.ts` - Password hashing and validation
- `lib/utils/session.ts` - JWT session management
- `lib/utils/cookies.ts` - Cookie management utilities
- `lib/validation/auth-schemas.ts` - Zod validation schemas

**API Routes:**
- `app/api/auth/register/route.ts` - User registration
- `app/api/auth/login/route.ts` - User login
- `app/api/auth/logout/route.ts` - User logout
- `app/api/auth/session/route.ts` - Session verification

**Unit Tests:**
- `lib/utils/password.test.ts` - Password utilities tests
- `lib/utils/session.test.ts` - Session utilities tests
- `lib/services/auth-service.test.ts` - Auth service tests

**Integration Tests:**
- `app/api/auth/register/route.test.ts` - Register endpoint tests
- `app/api/auth/login/route.test.ts` - Login endpoint tests
- `app/api/auth/logout/route.test.ts` - Logout endpoint tests
- `app/api/auth/session/route.test.ts` - Session endpoint tests

**Test Configuration:**
- `vitest.config.ts` - Vitest configuration
- `vitest.setup.ts` - Test setup and mocks

**UI Components (shadcn/ui):**
- `components/ui/button.tsx` - Button component
- `components/ui/input.tsx` - Input component
- `components/ui/label.tsx` - Label component
- `components/ui/card.tsx` - Card component
- `components/ui/form.tsx` - Form component with react-hook-form integration
- `components/ui/radio-group.tsx` - RadioGroup component
- `lib/utils.ts` - shadcn/ui utilities
- `components.json` - shadcn/ui configuration

**Custom Auth Components:**
- `components/auth/password-strength.tsx` - Password validation indicator
- `components/auth/login-form.tsx` - Login form with validation
- `components/auth/registration-form.tsx` - Registration form with validation

**Pages:**
- `app/login/page.tsx` - Login page
- `app/register/page.tsx` - Registration page
- `app/page.tsx` - Protected home page (root route, placeholder for future MCQ features)

**Note**: Implementation details and progress tracking should be maintained in separate phase summary documents (e.g., `docs/phase1_summary.md`, `docs/phase2_summary.md`, etc.)

### Implementation Patterns

**Password Hashing Pattern:**
```typescript
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string, 
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

**Password Validation Pattern:**
```typescript
import { z } from 'zod';

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/,
    'Password must contain at least one special character'
  );
```

**Registration Schema Pattern:**
```typescript
import { z } from 'zod';

export const registrationSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters'),
  lastName: z.string().optional(),
  email: z.string()
    .email('Please enter a valid email address'),
  password: passwordSchema,
  role: z.enum(['instructor', 'student'], {
    required_error: 'Please select a role'
  })
});
```

**Database Service Pattern:**
```typescript
import { getDatabase, executeQueryFirst, executeMutation } from '@/lib/d1-client';
import { hashPassword } from '@/lib/utils/password';

export async function createUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  role: 'instructor' | 'student';
}) {
  const db = getDatabase();
  const passwordHash = await hashPassword(userData.password);
  
  const sql = `
    INSERT INTO users (email, password_hash, first_name, last_name, role)
    VALUES (?, ?, ?, ?, ?)
    RETURNING id, email, first_name, last_name, role, created_at
  `;
  
  const result = await executeMutation(
    db,
    sql,
    [
      userData.email,
      passwordHash,
      userData.firstName,
      userData.lastName || null,
      userData.role
    ]
  );
  
  return result;
}
```

**Session Management Pattern:**
```typescript
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'development-secret-key'
);

export async function createSession(userId: string, role: string) {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SESSION_SECRET);
  
  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
  
  return token;
}

export async function getSession() {
  const token = cookies().get('session')?.value;
  
  if (!token) return null;
  
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}
```

### Important Notes

- Use Cloudflare D1 database for user storage (already configured)
- Follow Next.js 15 App Router patterns with Server Components
- Use Server Actions for form submissions where appropriate
- All passwords must be hashed with bcrypt (min 10 salt rounds)
- Email addresses are case-insensitive (normalize to lowercase before storage)
- Use shadcn/ui components exclusively for UI elements
- Implement proper CSRF protection for authentication endpoints
- Session tokens should be stored in HTTP-only cookies
- Consider rate limiting for login attempts in future phases
- All database queries should use parameterized statements (via d1-client helpers)
- **Home page is a placeholder**: The root route (`app/page.tsx`) will be a simple protected page showing welcome message and user role. This will be enhanced in Phase 8 with role-specific MCQ features (authoring for instructors, quiz-taking for students)
- Both instructor and student roles see the same placeholder home page initially - role-specific features will be added in future phases

---

## Success Criteria

The authentication system will be considered complete when all of the following criteria are met:

**Database (Phase 1):**
- [ ] Users table created with proper schema
- [ ] Email UNIQUE constraint enforced
- [ ] Role CHECK constraint enforced
- [ ] Indexes created for performance
- [ ] Migration applied successfully

**Backend Services (Phase 2):**
- [ ] Password hashing implemented (bcrypt)
- [ ] Password verification working correctly
- [ ] JWT session creation implemented
- [ ] JWT session verification implemented
- [ ] Zod validation schemas created
- [ ] Authentication service complete
- [ ] Unit tests written and passing

**API Endpoints (Phase 3):**
- [ ] POST /api/auth/register endpoint created
- [ ] POST /api/auth/login endpoint created
- [ ] POST /api/auth/logout endpoint created
- [ ] GET /api/auth/session endpoint created
- [ ] Cookie management utilities created
- [ ] All endpoints return consistent response formats
- [ ] Error handling covers all edge cases
- [ ] Integration tests written and passing

**UI Components (Phase 4):**
- [ ] All forms use shadcn/ui components
- [ ] Form validation provides clear, helpful error messages
- [ ] Loading states are shown during API calls
- [ ] Components are accessible and responsive

**Pages (Phase 5):**
- [ ] Users can register with email, password, name, and role
- [ ] Registration form validates all inputs according to requirements
- [ ] Password complexity requirements are enforced
- [ ] Duplicate email addresses are prevented
- [ ] Users can login with email and password
- [ ] Invalid login attempts show appropriate error messages
- [ ] Successful login creates a session and redirects to home page
- [ ] Home page displays user information and role appropriately

**Middleware (Phase 6):**
- [ ] Session persists across page reloads
- [ ] Users can logout and session is cleared
- [ ] Protected routes redirect to login if not authenticated

**Security:**
- [ ] Passwords are securely hashed in the database
- [ ] No passwords are logged or exposed in error messages
- [ ] Email addresses are validated and normalized
- [ ] HTTP-only cookies for session tokens
- [ ] Secure flags configured for production
- [ ] Parameterized database queries prevent SQL injection

**Testing:**
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Test coverage adequate for critical paths

**Production (Phase 7):**
- [ ] E2E tests complete
- [ ] Production deployment successful
- [ ] All flows working in production
- [ ] Performance acceptable
- [ ] No security vulnerabilities

**Note**: Track actual implementation progress in phase summary documents.

---

## Troubleshooting Guide

### Common Issue: D1 Parameter Binding Error

**Problem**: Error "SQLITE_ERROR: wrong number of arguments" when executing queries

**Cause**: D1 in local development sometimes has issues with anonymous placeholders (`?`)

**Solution**: 
- Always use the helper functions in `lib/d1-client.ts` which normalize placeholders
- Use `executeQuery`, `executeQueryFirst`, `executeMutation` instead of direct D1 calls
- These helpers automatically convert `?` to `?1`, `?2`, etc.

**Code Reference**: `lib/d1-client.ts`

### Common Issue: Password Validation Not Working

**Problem**: Password validation passes but backend rejects the password

**Cause**: Frontend and backend validation schemas are out of sync

**Solution**:
- Keep a single source of truth for validation rules
- Export validation schema from shared location
- Use the same regex patterns in both frontend and backend
- Document all validation rules in this PRD

**Code Reference**: `lib/validation/auth-schemas.ts`

### Common Issue: Session Not Persisting

**Problem**: User is logged out after page reload

**Cause**: Session cookie not being set correctly or middleware not validating session

**Solution**:
- Verify cookie settings include `httpOnly: true` and appropriate `sameSite` value
- Check that middleware is running on protected routes
- Verify SESSION_SECRET environment variable is set
- Check browser devtools for cookie presence and values

**Code Reference**: `lib/session.ts`, `middleware.ts`

### Common Issue: Email Already Exists Not Caught

**Problem**: Users can register with duplicate emails

**Cause**: Database constraint not set or error not handled properly

**Solution**:
- Verify UNIQUE constraint exists on email column in database
- Check that API route catches and handles SQLite UNIQUE constraint violations
- Return appropriate 409 Conflict status code
- Display user-friendly error message

**Code Reference**: `migrations/0001_create_users_table.sql`, `app/api/auth/register/route.ts`

---

## Future Enhancements

### Phase 8: MCQ Features (Next Priority After Authentication)

**For Instructors:**
- MCQ authoring interface (create, edit, delete questions)
- Quiz creation and management
- Question bank management
- Quiz settings and configuration

**For Students:**
- MCQ quiz taking interface
- Quiz list and status
- Quiz results and feedback
- Progress tracking

### Phase 9 and Beyond (Long-term Enhancements)

- Email verification for new registrations
- Password reset functionality via email
- Two-factor authentication (2FA)
- Social login (Google, GitHub, etc.)
- Remember me functionality
- Account settings page for updating profile
- Admin role for managing users
- User profile pictures/avatars
- Password change functionality for logged-in users
- Rate limiting for login attempts to prevent brute force
- Audit log for authentication events
- Account lockout after multiple failed login attempts
- Session management dashboard (see all active sessions)
- OAuth2 integration for third-party apps

---

## Dependencies

### External Dependencies

- **bcryptjs** - Password hashing library
  - Purpose: Securely hash passwords before storage
  - Installation: `npm install bcryptjs @types/bcryptjs`

- **jose** - JWT implementation for JavaScript
  - Purpose: Create and verify JWT session tokens stored in HTTP-only cookies
  - Why: Lightweight, edge-compatible, built for modern JavaScript/TypeScript
  - Installation: `npm install jose`

- **zod** - TypeScript-first schema validation
  - Purpose: Validate form inputs and API requests
  - Installation: Already installed (Next.js dependency)

- **react-hook-form** - Form state management
  - Purpose: Handle form state and validation in React
  - Installation: `npm install react-hook-form`

- **@hookform/resolvers** - Zod integration for react-hook-form
  - Purpose: Connect Zod schemas to react-hook-form
  - Installation: `npm install @hookform/resolvers`

### Internal Dependencies

- **Cloudflare D1 Database** - Already configured
  - Binding: `DB`
  - Database: `quizmaker-database`
  - ID: `bd172407-8e13-481a-8394-a37164dc1305`

- **lib/d1-client.ts** - Database client utilities (existing)
  - Purpose: Safe database query execution with parameter binding

- **shadcn/ui components** - UI component library
  - Components needed: Button, Input, Label, RadioGroup, Form, Card
  - Installation: Use `npx shadcn@latest add [component]`

### Environment Variables

Required environment variables:

```env
# .dev.vars (local development)
SESSION_SECRET=your-secure-random-string-for-development
NEXTJS_ENV=development

# Production (via wrangler secrets)
# SESSION_SECRET - Generated secure random string for production
```

To set production secrets:
```bash
npx wrangler secret put SESSION_SECRET
```

---

## Risks and Mitigation

### Technical Risks

- **Risk**: Password hashing may be slow on Cloudflare Workers, affecting response times
- **Mitigation**: 
  - Use appropriate bcrypt salt rounds (10 is recommended balance)
  - Consider async password hashing to avoid blocking
  - Monitor API response times and adjust if needed
  - Consider caching strategies for session validation

- **Risk**: D1 database limitations in local development may cause issues
- **Mitigation**:
  - Use the d1-client helper functions which handle parameter binding quirks
  - Test thoroughly in local environment before deploying
  - Document any workarounds needed
  - Keep queries simple and well-tested

- **Risk**: Session token size may grow too large with user data
- **Mitigation**:
  - Store only essential data in session (userId, role)
  - Fetch additional user data from database when needed
  - Keep JWT payload minimal
  - Set appropriate token expiration

- **Risk**: CORS issues when calling API from frontend
- **Mitigation**:
  - Use Next.js API routes (same origin)
  - Configure proper CORS headers if needed
  - Use Server Actions where appropriate for same-origin requests

### Security Risks

- **Risk**: Weak passwords may be accepted despite validation
- **Mitigation**:
  - Implement strict password validation on both frontend and backend
  - Show password strength indicator to encourage strong passwords
  - Consider password dictionary check in future phases
  - Educate users on password security

- **Risk**: Session hijacking via stolen tokens
- **Mitigation**:
  - Use HTTP-only cookies (not accessible via JavaScript)
  - Set secure flag in production (HTTPS only)
  - Use sameSite flag to prevent CSRF
  - Implement session expiration (7 days)
  - Consider adding IP validation in future

- **Risk**: SQL injection attacks
- **Mitigation**:
  - Always use parameterized queries via d1-client helpers
  - Never concatenate user input into SQL strings
  - Validate and sanitize all user inputs
  - Follow D1 best practices

- **Risk**: Brute force login attempts
- **Mitigation**:
  - Consider rate limiting in future phases
  - Implement account lockout after multiple failures (future)
  - Log failed login attempts for monitoring
  - Use CAPTCHA for repeated failures (future)

### User Experience Risks

- **Risk**: Users may forget which email they used to register
- **Mitigation**:
  - Provide clear error messages
  - Add "forgot password" feature in future phases
  - Consider email verification to confirm ownership

- **Risk**: Password requirements may frustrate users
- **Mitigation**:
  - Show password requirements clearly before user starts typing
  - Provide real-time feedback with visual indicators (checkmarks)
  - Explain why requirements exist (security)
  - Make error messages helpful, not punishing

- **Risk**: Users may lose access if session expires while working
- **Mitigation**:
  - Set reasonable session expiration (7 days)
  - Consider "remember me" option in future
  - Implement graceful session renewal
  - Save work automatically where possible (future quiz features)

- **Risk**: Mobile users may have difficulty with form inputs
- **Mitigation**:
  - Use appropriate input types (email, password)
  - Ensure forms are responsive and mobile-friendly
  - Test on various screen sizes
  - Use shadcn components which are mobile-optimized

---

## Notes for AI Agents

When implementing this feature:

1. **Start with Phase 1** and work sequentially through phases
2. **Document implementation progress** in separate phase summary documents (e.g., `docs/phase1_summary.md`)
3. **Keep this PRD as requirements** - don't update it with implementation status
4. **Follow all cursor rules** and project standards documented in `.cursorrules`
5. **Use shadcn/ui components** exclusively - never use plain HTML elements for interactive components
6. **Write tests** for all services and critical functionality
7. **Reference code using format**: `filepath:line-number`
8. **Security first** - never log passwords, always hash before storage, use parameterized queries
9. **Mobile-friendly** - ensure all UI works on mobile devices
10. **Accessibility** - use proper labels, ARIA attributes, keyboard navigation
11. **Home page is intentionally simple** - Keep the home page (`app/page.tsx`) as a basic placeholder with welcome message, user info, and logout button. Do NOT implement MCQ features yet - those will be Phase 8
12. **Same page for both roles** - Initially, both instructors and students see the same placeholder home page. Role-specific features will be added later
13. **Add troubleshooting entries** to this PRD when you discover common issues
14. **Update code examples** if you find better patterns during implementation

---

## Current Status

**Last Updated**: December 18, 2025
**Current Phase**: Planning & Implementation
**Status**: Technical Requirements Document

**Authentication Approach**: Simple JWT-based session management with HTTP-only cookies

**Implementation Philosophy**: 
We're implementing a **simple, basic authentication system** using JWT for session management. This is the simplest modern approach - just username/password login with secure sessions. No advanced features (refresh tokens, social login, etc.) in Phase 1 - those come later if needed.

**Phased Implementation Strategy**:
Each phase is independently:
- ✅ **Developable**: Can be built separately
- ✅ **Deployable**: Can be deployed to environment
- ✅ **Testable**: Can be tested in isolation

**Implementation Order**:
1. **Phase 1**: Database (migrations, tables) - Test with wrangler CLI
2. **Phase 2**: Backend Services (password, JWT, validation) - Test with unit tests
3. **Phase 3**: API Endpoints (REST APIs) - Test with curl/Postman
4. **Phase 4**: UI Components (forms, validation) - Test in isolation
5. **Phase 5**: Pages (login, register, home) - Test in browser
6. **Phase 6**: Middleware (route protection) - Test route access
7. **Phase 7**: E2E Testing & Production - Deploy to Cloudflare

**Implementation Approach**: 
- Follow the phased implementation strategy outlined in this document
- Each phase should be independently developable, deployable, and testable
- Test each phase thoroughly before moving to the next
- Document implementation details in separate phase-specific documents (e.g., `docs/phase1_summary.md`)
- Keep this PRD focused on requirements and specifications

**Deployment Strategy**:
- **Local Development**: Each phase should be tested locally first
- **Phase Testing**: Each phase should be independently verified
- **Production Deployment**: 
  - Deploy to Cloudflare Workers after all phases complete
  - Apply database migrations to production
  - Set production environment variables
  - Verify all functionality works in production environment

**Note on Scope**:
- Authentication system will be built in 7 logical phases
- Each phase builds on the previous one
- Using JWT tokens stored in HTTP-only cookies for security
- Home page will be a simple placeholder for both roles
- MCQ features will be Phase 8 (after authentication complete)

**Key Technical Decisions Made (Phase 1 - Simple Implementation)**:
- ✅ **Authentication Type**: Username/password (email + password)
- ✅ **Session Management**: Simple JWT with HTTP-only cookies (no refresh tokens)
- ✅ **Password Hashing**: bcrypt with 10 salt rounds
- ✅ **JWT Library**: jose (lightweight, edge-compatible)
- ✅ **Token Expiration**: 7 days (user re-login required after)
- ✅ **Session Storage**: Stateless (client-side cookies only)
- ✅ **Logout**: Simple (just clear cookie, no token blacklist)
- ✅ **UI Framework**: shadcn/ui components
- ✅ **Form Validation**: react-hook-form + zod
- ✅ **Complexity**: Low - keeping it simple!
- ✅ **Implementation**: Phased, independently testable & deployable

**What's NOT in Phase 1-7 (can be added in Phase 9+ if needed)**:
- ❌ Refresh tokens
- ❌ Token revocation/blacklisting
- ❌ Social login
- ❌ Two-factor authentication
- ❌ Email verification
- ❌ Password reset
- ❌ Rate limiting
- ❌ Account lockout

**Phase Overview**:
- Phase 1: Database Foundation - Set up database schema and migrations
- Phase 2: Core Backend Services - Build authentication business logic
- Phase 3: API Endpoints Layer - Create RESTful API endpoints
- Phase 4: UI Components Library - Build reusable React components
- Phase 5: Authentication Pages - Create login, register, and home pages
- Phase 6: Middleware & Session - Implement route protection
- Phase 7: E2E Testing & Production - Deploy to production

**Note**: Track implementation progress in separate phase summary documents (e.g., `docs/phase1_summary.md`)

---

## Implementation Checklist

### Pre-Implementation
- [ ] Review and approve this PRD
- [ ] Understand authentication strategy (Simple JWT with HTTP-only cookies)
- [ ] Understand phased deployment approach
- [ ] Ensure Cloudflare account access
- [ ] Ensure database is configured (quizmaker-database)

### Phase 1: Database Foundation
**Deploy**: `npx wrangler d1 migrations apply quizmaker-database --local`

- [ ] Create migration file `migrations/0001_create_users_table.sql`
- [ ] Include users table with all columns
- [ ] Add UNIQUE constraint on email
- [ ] Add CHECK constraint on role
- [ ] Add indexes on email and role
- [ ] Apply migration to local database
- [ ] Verify table exists
- [ ] Test UNIQUE email constraint
- [ ] Test role CHECK constraint
- [ ] Document schema in PRD

### Phase 2: Core Backend Services ⏳
**Deploy**: `npm install bcryptjs jose zod && npm test`

- [ ] Install bcryptjs and types
- [ ] Install jose (JWT library)
- [ ] Install zod (validation)
- [ ] Generate SESSION_SECRET and add to .dev.vars
- [ ] Create `lib/utils/password.ts` (hash, verify)
- [ ] Create `lib/utils/session.ts` (create JWT, validate JWT)
- [ ] Create `lib/validation/auth-schemas.ts` (Zod schemas)
- [ ] Create `lib/services/auth-service.ts` (register, login, verify)
- [ ] Write unit tests for password utilities
- [ ] Write unit tests for session utilities
- [ ] Write unit tests for auth service
- [ ] All tests pass

### Phase 3: API Endpoints Layer
**Deploy**: `npm run dev`
**Test**: `npm test -- --run app/api/auth`

- [ ] Create `lib/utils/cookies.ts` (cookie management utilities)
- [ ] Create `app/api/auth/register/route.ts`
- [ ] Create `app/api/auth/login/route.ts`
- [ ] Create `app/api/auth/logout/route.ts`
- [ ] Create `app/api/auth/session/route.ts`
- [ ] **Create integration tests for all endpoints**
- [ ] Test successful registration (instructor & student)
- [ ] Test validation errors (missing fields, invalid formats)
- [ ] Test duplicate email handling (409)
- [ ] Test weak password rejection
- [ ] Test successful login (both roles)
- [ ] Test invalid credentials (401)
- [ ] Test cookie setting and clearing
- [ ] Test session verification
- [ ] Test server error handling
- [ ] Create API testing guide documentation
- [ ] Verify all error responses have consistent format

### Phase 4: UI Components Library ⏳
**Deploy**: `npx shadcn@latest add button input label card form && npm install react-hook-form @hookform/resolvers`

- [ ] Install shadcn Button component
- [ ] Install shadcn Input component
- [ ] Install shadcn Label component
- [ ] Install shadcn Card component
- [ ] Install shadcn Form component
- [ ] Install shadcn RadioGroup component
- [ ] Install react-hook-form
- [ ] Install @hookform/resolvers
- [ ] Create `components/auth/LoginForm.tsx`
- [ ] Create `components/auth/RegistrationForm.tsx`
- [ ] Create `components/auth/PasswordStrength.tsx`
- [ ] Test LoginForm validates email
- [ ] Test LoginForm validates required fields
- [ ] Test RegistrationForm validates all fields
- [ ] Test PasswordStrength indicator updates
- [ ] Test loading states
- [ ] Test error display

### Phase 5: Authentication Pages ⏳
**Deploy**: Already deployed with dev server
**Test**: Manual browser testing

- [ ] Create `app/login/page.tsx`
- [ ] Create `app/register/page.tsx`
- [ ] Create `app/page.tsx` (protected home page)
- [ ] Test navigation from login to register
- [ ] Test navigation from register to login
- [ ] Test registration flow (register → login → home)
- [ ] Test login flow (login → home)
- [ ] Test unauthenticated access to / redirects to /login
- [ ] Test session persistence (refresh page, still logged in)
- [ ] Test logout redirects to /login

### Phase 6: Middleware & Session Management ⏳
**Deploy**: Automatic with application
**Test**: Test protected routes

- [ ] Create `middleware.ts`
- [ ] Create `lib/auth/middleware-helpers.ts` (if needed)
- [ ] Implement session validation in middleware
- [ ] Implement redirect logic for unauthenticated users
- [ ] Implement redirect logic for authenticated users on /login
- [ ] Test protected route access (not authenticated) → redirect
- [ ] Test protected route access (authenticated) → allow
- [ ] Test public route access (no authentication required)
- [ ] Test session expiration handling
- [ ] Test middleware performance

### Phase 7: End-to-End Testing & Production Deployment ⏳
**Deploy**: `npm run deploy`

- [ ] Run all unit tests
- [ ] Test complete registration flow (browser)
- [ ] Test complete login flow (browser)
- [ ] Test logout flow (browser)
- [ ] Test session persistence (browser)
- [ ] Test duplicate email error (browser)
- [ ] Test invalid credentials error (browser)
- [ ] Test password validation (browser)
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari (if Mac available)
- [ ] Test on mobile Chrome (responsive)
- [ ] Test on mobile Safari (responsive)
- [ ] Security audit (no console errors, passwords not logged)
- [ ] Generate production SESSION_SECRET
- [ ] Set production SESSION_SECRET via wrangler
- [ ] Apply migrations to production database
- [ ] Deploy to Cloudflare Workers
- [ ] Test production registration
- [ ] Test production login
- [ ] Test production logout
- [ ] Test production session persistence
- [ ] Verify production performance
- [ ] Update documentation with production URLs
- [ ] Mark Phase 1-7 as COMPLETED ✅
- [ ] Ready for Phase 8 (MCQ features)

---

*This document will be updated throughout implementation with actual code examples, file locations, and lessons learned.*

