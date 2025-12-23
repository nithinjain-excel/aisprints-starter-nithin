# Phase 6: Middleware Testing Guide

This guide provides comprehensive testing scenarios for the authentication middleware.

---

## Middleware Overview

The middleware (`middleware.ts`) handles automatic session validation and route protection:

- **Protected Routes**: `/` (home page) - requires authentication
- **Public Routes**: `/login`, `/register` - accessible without authentication
- **API Routes**: Not handled by middleware (have their own validation)

---

## Testing Scenarios

### Scenario 1: Unauthenticated User Accessing Home Page

**Setup**: No session cookie (logged out or new user)

**Steps**:
1. Open browser in incognito mode
2. Navigate to `http://localhost:3000/`

**Expected Result**:
- Middleware intercepts the request
- Redirects to `/login?redirect=/`
- Login page displays

**Status**: ✅ Should work automatically

---

### Scenario 2: Unauthenticated User Accessing Login Page

**Setup**: No session cookie

**Steps**:
1. Open browser in incognito mode
2. Navigate to `http://localhost:3000/login`

**Expected Result**:
- Middleware allows access to login page
- Login page displays normally
- No redirect occurs

**Status**: ✅ Should work automatically

---

### Scenario 3: Authenticated User Accessing Home Page

**Setup**: Valid session cookie (user is logged in)

**Steps**:
1. Login with valid credentials
2. Navigate to `http://localhost:3000/`

**Expected Result**:
- Middleware validates session
- Allows access to home page
- Home page displays with user data

**Status**: ✅ Should work automatically

---

### Scenario 4: Authenticated User Accessing Login Page

**Setup**: Valid session cookie (user is logged in)

**Steps**:
1. Login with valid credentials
2. Try to navigate to `http://localhost:3000/login`

**Expected Result**:
- Middleware validates session
- Detects user is already authenticated
- Redirects to `/` (home page)
- User cannot access login page while logged in

**Status**: ✅ Should work automatically

---

### Scenario 5: Authenticated User Accessing Register Page

**Setup**: Valid session cookie (user is logged in)

**Steps**:
1. Login with valid credentials
2. Try to navigate to `http://localhost:3000/register`

**Expected Result**:
- Middleware validates session
- Detects user is already authenticated
- Redirects to `/` (home page)
- User cannot access register page while logged in

**Status**: ✅ Should work automatically

---

### Scenario 6: Expired Session Token

**Setup**: Expired JWT token in cookie

**Steps**:
1. Login with valid credentials
2. Wait for token to expire (7 days, or manually set expired token)
3. Try to access home page

**Expected Result**:
- Middleware validates session
- Token verification fails (expired)
- Treats user as unauthenticated
- Redirects to `/login?redirect=/`

**Status**: ✅ Should work automatically

---

### Scenario 7: Invalid Session Token

**Setup**: Invalid/malformed JWT token in cookie

**Steps**:
1. Manually set invalid session cookie (e.g., via browser dev tools)
2. Try to access home page

**Expected Result**:
- Middleware attempts to verify session
- Verification fails (invalid token)
- Error logged to console
- Treats user as unauthenticated
- Redirects to `/login?redirect=/`

**Status**: ✅ Should work automatically

---

### Scenario 8: Session Persistence Across Page Reloads

**Setup**: Valid session cookie

**Steps**:
1. Login with valid credentials
2. Refresh the home page multiple times

**Expected Result**:
- Middleware validates session on each request
- Session remains valid
- User stays logged in
- Home page displays each time

**Status**: ✅ Should work automatically

---

### Scenario 9: Logout and Redirect

**Setup**: Valid session cookie

**Steps**:
1. Login with valid credentials
2. Navigate to home page
3. Click "Logout" button

**Expected Result**:
- API clears session cookie
- Redirect to `/login`
- Middleware treats user as unauthenticated
- If user tries to access `/`, redirected to `/login`

**Status**: ✅ Should work automatically

---

### Scenario 10: Direct API Access (No Middleware)

**Setup**: No session cookie

**Steps**:
1. Use curl or Postman to access `/api/auth/session`

**Expected Result**:
- Middleware does NOT intercept (API routes excluded)
- API endpoint handles its own authentication
- Returns 401 Unauthorized

**Status**: ✅ Should work automatically

---

## Manual Testing Checklist

### Before Testing
- [ ] Ensure `npm run dev` is running
- [ ] Clear all cookies for localhost:3000
- [ ] Have browser dev tools open (Network and Application tabs)

### Test Flow 1: New User Journey
- [ ] Navigate to `http://localhost:3000/`
- [ ] Verify redirect to `/login`
- [ ] Click "Sign up" link
- [ ] Verify navigation to `/register`
- [ ] Fill registration form with valid data
- [ ] Click "Create account"
- [ ] Verify redirect to `/` (home page)
- [ ] Verify home page displays user data
- [ ] Verify session cookie exists (Application > Cookies)

### Test Flow 2: Existing User Login
- [ ] Clear cookies (logout)
- [ ] Navigate to `/login`
- [ ] Fill login form with valid credentials
- [ ] Click "Login"
- [ ] Verify redirect to `/` (home page)
- [ ] Verify session cookie exists

### Test Flow 3: Protected Route Access
- [ ] Ensure logged in
- [ ] Refresh home page
- [ ] Verify still logged in (no redirect)
- [ ] Open new tab, navigate to `http://localhost:3000/`
- [ ] Verify home page displays (session works across tabs)

### Test Flow 4: Authenticated User Cannot Access Auth Pages
- [ ] Ensure logged in
- [ ] Try to navigate to `/login`
- [ ] Verify redirect to `/`
- [ ] Try to navigate to `/register`
- [ ] Verify redirect to `/`

### Test Flow 5: Logout Flow
- [ ] Ensure logged in on home page
- [ ] Click "Logout" button
- [ ] Verify redirect to `/login`
- [ ] Try to navigate to `/`
- [ ] Verify redirect to `/login` (no longer authenticated)

### Test Flow 6: Session Cookie Validation
- [ ] Login successfully
- [ ] Open Application tab in dev tools
- [ ] Verify session cookie has:
  - `HttpOnly`: true
  - `Secure`: false (in dev), true (in production)
  - `SameSite`: Lax
  - Expiration: 7 days from now

---

## Browser Testing Matrix

| Browser | Version | Scenario 1-5 | Scenario 6-9 | Status |
|---------|---------|--------------|--------------|--------|
| Chrome  | Latest  | [ ]          | [ ]          | -      |
| Firefox | Latest  | [ ]          | [ ]          | -      |
| Safari  | Latest  | [ ]          | [ ]          | -      |
| Edge    | Latest  | [ ]          | [ ]          | -      |

---

## Network Tab Verification

When testing, check the Network tab for these responses:

### Successful Middleware Redirect (Unauthenticated → Login)
```
Request: GET /
Status: 307 Temporary Redirect
Location: /login?redirect=/
```

### Successful Middleware Redirect (Authenticated → Home from Login)
```
Request: GET /login
Status: 307 Temporary Redirect
Location: /
```

### Successful Middleware Pass-Through
```
Request: GET / (with valid session)
Status: 200 OK
Response: HTML page
```

---

## Common Issues and Debugging

### Issue: Middleware not running
**Symptoms**: No redirects happening, routes accessible without auth
**Check**:
- Ensure `middleware.ts` is at the root (not in `src/`)
- Check `config.matcher` pattern
- Restart dev server

### Issue: Infinite redirect loop
**Symptoms**: Browser shows "too many redirects" error
**Check**:
- Middleware logic for redirect conditions
- Ensure public routes are correctly defined
- Check if both middleware AND page are redirecting

### Issue: Session valid but still redirected
**Symptoms**: User logs in but immediately redirected back to login
**Check**:
- Session cookie is being set correctly
- Session token is valid (check JWT in Application > Cookies)
- `verifySession()` function is working
- Console for any errors

### Issue: Cannot access login page after logout
**Symptoms**: Logout works but login page is inaccessible
**Check**:
- Cookie is actually being cleared by logout API
- Middleware is treating logged-out user as unauthenticated
- Clear cookies manually and retry

---

## Performance Considerations

### Middleware Execution Time

The middleware should execute quickly (<10ms) because it runs on every request:

- **Session verification**: ~5ms (JWT verification)
- **Redirect logic**: <1ms
- **Total**: ~6ms per request

### Monitoring

Add timing logs to middleware for performance monitoring:

```typescript
const start = Date.now();
// ... middleware logic ...
const duration = Date.now() - start;
console.log(`Middleware execution time: ${duration}ms`);
```

---

## Security Verification

### Checklist

- [ ] Session tokens are HTTP-only (not accessible via JavaScript)
- [ ] Protected routes require valid session
- [ ] Expired tokens are rejected
- [ ] Invalid tokens are rejected
- [ ] Authenticated users cannot access auth pages
- [ ] No sensitive data logged in middleware
- [ ] Session cookie has proper flags (HttpOnly, Secure in prod, SameSite)

---

## Next Steps After Testing

Once all scenarios pass:

1. ✅ Mark Phase 6 as complete
2. 📝 Document any issues found and resolutions
3. ✅ Update Phase 6 summary with test results
4. 🚀 Ready for Phase 7: E2E Testing & Production Deployment

---

*This testing guide should be used to verify that the middleware is working correctly before moving to Phase 7.*





