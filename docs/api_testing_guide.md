# API Endpoints Testing Guide

## Phase 3: Authentication API Endpoints

This guide provides test commands for all authentication endpoints.

### Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:3000`

2. **Ensure database is accessible:**
   - Phase 1 migration should be applied (users table exists)
   - `.dev.vars` file contains `SESSION_SECRET`

---

## Test Sequence

### 1. Test Registration Endpoint

**Endpoint:** `POST /api/auth/register`

**Test Case 1: Successful Registration (Instructor)**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"teacher@example.com\",
    \"password\": \"SecurePass123!\",
    \"firstName\": \"Jane\",
    \"lastName\": \"Doe\",
    \"role\": \"instructor\"
  }"
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": "...",
    "email": "teacher@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "instructor"
  }
}
```

**Test Case 2: Successful Registration (Student)**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"student@example.com\",
    \"password\": \"MyPassword123!\",
    \"firstName\": \"John\",
    \"role\": \"student\"
  }"
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": "...",
    "email": "student@example.com",
    "firstName": "John",
    "lastName": null,
    "role": "student"
  }
}
```

**Test Case 3: Duplicate Email (Should Fail)**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"teacher@example.com\",
    \"password\": \"AnotherPass123!\",
    \"firstName\": \"Another\",
    \"role\": \"instructor\"
  }"
```

**Expected Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Email already registered",
  "message": "An account with this email already exists. Please login instead."
}
```

**Test Case 4: Invalid Password (Should Fail)**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@example.com\",
    \"password\": \"weak\",
    \"firstName\": \"Test\",
    \"role\": \"student\"
  }"
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

---

### 2. Test Login Endpoint

**Endpoint:** `POST /api/auth/login`

**Test Case 1: Successful Login**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{
    \"email\": \"teacher@example.com\",
    \"password\": \"SecurePass123!\"
  }"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "teacher@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "instructor"
  }
}
```

**Note:** The `-c cookies.txt` flag saves cookies to a file for subsequent requests.

**Test Case 2: Invalid Email (Should Fail)**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"nonexistent@example.com\",
    \"password\": \"SomePassword123!\"
  }"
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "The email or password you entered is incorrect. Please try again."
}
```

**Test Case 3: Wrong Password (Should Fail)**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"teacher@example.com\",
    \"password\": \"WrongPassword123!\"
  }"
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "The email or password you entered is incorrect. Please try again."
}
```

---

### 3. Test Session Verification Endpoint

**Endpoint:** `GET /api/auth/session`

**Test Case 1: Valid Session (After Login)**

```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "authenticated": true,
  "user": {
    "id": "...",
    "email": "teacher@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "instructor"
  }
}
```

**Note:** The `-b cookies.txt` flag sends the saved cookies.

**Test Case 2: No Session (Should Fail)**

```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Content-Type: application/json"
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "authenticated": false,
  "message": "No active session"
}
```

---

### 4. Test Logout Endpoint

**Endpoint:** `POST /api/auth/logout`

**Test Case 1: Successful Logout**

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Test Case 2: Verify Session After Logout (Should Fail)**

```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "authenticated": false,
  "message": "No active session"
}
```

---

## Complete Test Flow

Here's a complete test flow that tests the entire authentication cycle:

```bash
# 1. Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"testuser@example.com","password":"TestPass123!","firstName":"Test","lastName":"User","role":"student"}'

# 2. Verify session after registration
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt

# 3. Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt

# 4. Verify session is cleared
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt

# 5. Login again
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"testuser@example.com","password":"TestPass123!"}'

# 6. Verify session after login
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt
```

---

## Testing with PowerShell (Windows)

If you're on Windows and prefer PowerShell, here are equivalent commands:

### Registration:
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/register" `
  -ContentType "application/json" `
  -Body '{"email":"teacher@example.com","password":"SecurePass123!","firstName":"Jane","lastName":"Doe","role":"instructor"}' `
  -SessionVariable session
```

### Login:
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"teacher@example.com","password":"SecurePass123!"}' `
  -SessionVariable session
```

### Get Session:
```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/auth/session" `
  -WebSession $session
```

### Logout:
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/logout" `
  -WebSession $session
```

---

## Success Criteria

All tests pass if:

- ✅ Registration creates a new user and returns 201
- ✅ Duplicate email returns 409 error
- ✅ Invalid password returns 400 validation error
- ✅ Login with correct credentials returns 200 and sets cookie
- ✅ Login with wrong credentials returns 401
- ✅ Session endpoint returns user data when authenticated
- ✅ Session endpoint returns 401 when not authenticated
- ✅ Logout clears the session cookie
- ✅ Session is invalid after logout

---

## Troubleshooting

### Issue: "D1 database binding not found"
**Solution:** Ensure `wrangler.jsonc` has the correct D1 binding and restart the dev server.

### Issue: "SESSION_SECRET environment variable is not set"
**Solution:** Ensure `.dev.vars` file exists and contains `SESSION_SECRET=...`

### Issue: "UNIQUE constraint failed"
**Solution:** User with that email already exists. Use a different email or clear the database.

### Issue: Cookies not working
**Solution:** 
- Ensure you're using `-c` flag to save cookies and `-b` flag to send them
- Check that cookies.txt file is created and readable

---

## Next Steps

Once all API tests pass:
- ✅ Phase 3 complete
- ⏳ Ready for Phase 4: UI Components Library

