# Phase 7: End-to-End Test Scenarios

**Purpose**: Comprehensive manual testing guide for the QuizMaker authentication system before production deployment.

---

## Test Environment Setup

### Prerequisites

- [ ] Dev server running (`npm run dev`)
- [ ] Browser dev tools open (Network, Application, Console tabs)
- [ ] Clean browser state (clear cookies, cache, localStorage)
- [ ] Test data ready (valid email addresses for testing)

### Test Users

Create these test accounts during testing:

1. **Instructor Account**
   - Email: `instructor.test@example.com`
   - Password: `Test1234!`
   - Role: Instructor

2. **Student Account**
   - Email: `student.test@example.com`
   - Password: `Test1234!`
   - Role: Student

---

## E2E Test Scenarios

### Scenario 1: Complete New User Registration Flow

**Objective**: Verify a new user can register and immediately access the application.

**Steps**:
1. Open incognito/private window
2. Navigate to `http://localhost:3000/`
3. Verify redirect to `/login`
4. Click "Sign up" link
5. Verify navigation to `/register`
6. Fill registration form:
   - First Name: `John`
   - Last Name: `Instructor` (or leave empty)
   - Email: `john.instructor@test.com`
   - Password: `SecurePass123!`
   - Role: Select `Instructor`
7. Observe password strength indicator updates
8. Click "Create account" button
9. Verify loading state shows ("Creating account...")
10. Verify redirect to `/` (home page)
11. Verify home page displays:
    - Welcome message with name "John Instructor"
    - Role badge showing "Instructor"
    - Email showing `john.instructor@test.com`
    - Logout button
    - Role-specific placeholder content

**Expected Result**: ✅ User successfully registered and logged in

**Checkpoints**:
- [ ] Registration form validation works
- [ ] Password strength indicator updates in real-time
- [ ] Successful registration redirects to home
- [ ] Session cookie is set (check Application > Cookies)
- [ ] User data displays correctly on home page
- [ ] No console errors

---

### Scenario 2: Duplicate Email Registration

**Objective**: Verify system prevents duplicate email registrations.

**Steps**:
1. Try to register with an email that already exists
2. Use same email from Scenario 1: `john.instructor@test.com`
3. Fill all fields correctly
4. Click "Create account"

**Expected Result**: ❌ Error message "Email already registered"

**Checkpoints**:
- [ ] Error message displays clearly
- [ ] User stays on registration page
- [ ] Form data is preserved
- [ ] HTTP status 409 (Conflict) in Network tab

---

### Scenario 3: Password Validation

**Objective**: Verify all password requirements are enforced.

**Test Cases**:

#### 3a. Password Too Short
- Password: `Test1!`
- Expected: ❌ "Password must be at least 8 characters long"

#### 3b. Missing Uppercase
- Password: `test1234!`
- Expected: ❌ "Password must contain at least one uppercase letter"

#### 3c. Missing Number
- Password: `TestPassword!`
- Expected: ❌ "Password must contain at least one number"

#### 3d. Missing Special Character
- Password: `TestPassword1`
- Expected: ❌ "Password must contain at least one special character"

#### 3e. Valid Password
- Password: `TestPass123!`
- Expected: ✅ All requirements met, green checkmarks

**Checkpoints**:
- [ ] Real-time validation feedback
- [ ] Clear error messages
- [ ] Visual indicators (checkmarks)

---

### Scenario 4: Existing User Login Flow

**Objective**: Verify existing users can log in successfully.

**Steps**:
1. Open new incognito window
2. Navigate to `http://localhost:3000/login`
3. Enter credentials from Scenario 1:
   - Email: `john.instructor@test.com`
   - Password: `SecurePass123!`
4. Click "Login" button
5. Verify redirect to `/` (home page)
6. Verify user data displays correctly

**Expected Result**: ✅ User successfully logged in

**Checkpoints**:
- [ ] Login successful
- [ ] Redirect to home page
- [ ] Session cookie set
- [ ] User data correct
- [ ] No console errors

---

### Scenario 5: Invalid Login Credentials

**Objective**: Verify system rejects invalid credentials.

**Test Cases**:

#### 5a. Wrong Password
- Email: `john.instructor@test.com`
- Password: `WrongPassword123!`
- Expected: ❌ "Invalid email or password"

#### 5b. Non-existent Email
- Email: `nonexistent@test.com`
- Password: `AnyPassword123!`
- Expected: ❌ "Invalid email or password"

#### 5c. Empty Fields
- Email: (empty)
- Password: (empty)
- Expected: ❌ Validation errors for both fields

**Checkpoints**:
- [ ] Generic error message (no specific info)
- [ ] User stays on login page
- [ ] No session cookie set
- [ ] HTTP status 401 (Unauthorized)

---

### Scenario 6: Session Persistence

**Objective**: Verify session persists across page reloads.

**Steps**:
1. Login successfully
2. Navigate to home page
3. Refresh the page (F5)
4. Verify still logged in
5. Open new tab, navigate to `http://localhost:3000/`
6. Verify still logged in (same session)
7. Close and reopen browser (within 7 days)
8. Navigate to `http://localhost:3000/`
9. Verify still logged in

**Expected Result**: ✅ Session persists

**Checkpoints**:
- [ ] Session persists after refresh
- [ ] Session works across tabs
- [ ] Session survives browser restart
- [ ] Cookie expiration is 7 days

---

### Scenario 7: Logout Flow

**Objective**: Verify logout clears session and redirects correctly.

**Steps**:
1. Ensure logged in on home page
2. Click "Logout" button
3. Verify button shows loading state
4. Verify redirect to `/login`
5. Try to navigate to `/`
6. Verify redirect back to `/login` (not authenticated)

**Expected Result**: ✅ User successfully logged out

**Checkpoints**:
- [ ] Logout button works
- [ ] Redirect to login page
- [ ] Session cookie cleared
- [ ] Cannot access protected routes
- [ ] HTTP status 200 for logout

---

### Scenario 8: Middleware Route Protection

**Objective**: Verify middleware protects routes correctly.

#### 8a. Unauthenticated User Accessing Home
**Steps**:
1. Logout (or open incognito)
2. Navigate directly to `http://localhost:3000/`

**Expected**: Redirect to `/login?redirect=/`

#### 8b. Authenticated User Accessing Login
**Steps**:
1. Login successfully
2. Try to navigate to `/login`

**Expected**: Redirect to `/` (home page)

#### 8c. Authenticated User Accessing Register
**Steps**:
1. Ensure logged in
2. Try to navigate to `/register`

**Expected**: Redirect to `/` (home page)

**Checkpoints**:
- [ ] All redirects work correctly
- [ ] HTTP status 307 (Temporary Redirect)
- [ ] Redirect happens before page loads

---

### Scenario 9: Role-Specific Content

**Objective**: Verify different roles see appropriate content.

**Steps**:

#### 9a. Instructor Role
1. Login as instructor
2. Verify home page shows instructor-specific content:
   - "Create and manage multiple-choice quizzes"
   - "Build question banks for your courses"
   - "Assign quizzes to students"
   - "View student results and analytics"

#### 9b. Student Role
1. Logout and login as student
2. Verify home page shows student-specific content:
   - "Take quizzes assigned by your instructors"
   - "View your quiz results and feedback"
   - "Track your progress over time"
   - "Access quiz history and scores"

**Checkpoints**:
- [ ] Correct role displayed
- [ ] Role-specific content shows
- [ ] Badge shows correct role

---

### Scenario 10: Email Case Sensitivity

**Objective**: Verify email addresses are case-insensitive.

**Steps**:
1. Register with: `Test@Example.Com`
2. Logout
3. Login with: `test@example.com` (all lowercase)
4. Verify login successful
5. Try to register with: `TEST@EXAMPLE.COM`
6. Verify error: "Email already registered"

**Expected Result**: ✅ Emails are case-insensitive

**Checkpoints**:
- [ ] Can login with different case
- [ ] Cannot register duplicate with different case

---

### Scenario 11: Form Validation UI

**Objective**: Verify all validation messages display correctly.

**Test Cases**:

#### 11a. Registration Form
- First Name: (empty) → "First name must be at least 2 characters"
- First Name: "J" → "First name must be at least 2 characters"
- Email: "invalid" → "Please enter a valid email address"
- Email: "test@" → "Please enter a valid email address"
- Role: (not selected) → "Please select a role"

#### 11b. Login Form
- Email: "invalid" → "Please enter a valid email address"
- Password: (empty) → "Password is required"

**Checkpoints**:
- [ ] All validation messages clear
- [ ] Messages appear inline
- [ ] Red color for errors
- [ ] No form submission with errors

---

### Scenario 12: Security - Cookie Settings

**Objective**: Verify session cookies have correct security settings.

**Steps**:
1. Login successfully
2. Open Application tab in Dev Tools
3. Navigate to Cookies > `http://localhost:3000`
4. Find `session` cookie
5. Verify cookie attributes:
   - **HttpOnly**: ✅ true
   - **Secure**: ❌ false (dev), ✅ true (prod)
   - **SameSite**: Lax
   - **Expires**: ~7 days from now
   - **Path**: /

**Checkpoints**:
- [ ] HttpOnly prevents JavaScript access
- [ ] Secure in production only
- [ ] SameSite prevents CSRF
- [ ] Correct expiration (7 days)

---

### Scenario 13: Security - No Password Leakage

**Objective**: Verify passwords never appear in responses or logs.

**Steps**:
1. Open Network tab
2. Register or login
3. Check all network responses
4. Check browser console logs
5. Check server console logs

**Expected**: ❌ No passwords in any output

**Checkpoints**:
- [ ] No password in API responses
- [ ] No password in console logs
- [ ] No password in error messages
- [ ] Only password_hash in database

---

### Scenario 14: Navigation Between Pages

**Objective**: Verify all navigation links work correctly.

**Steps**:
1. On `/login` → Click "Sign up" → Navigates to `/register`
2. On `/register` → Click "Sign in" → Navigates to `/login`
3. Login → Redirects to `/`
4. On `/` → Click "Logout" → Redirects to `/login`

**Checkpoints**:
- [ ] All links work
- [ ] No broken navigation
- [ ] Correct redirects

---

### Scenario 15: Responsive Design

**Objective**: Verify UI works on different screen sizes.

**Test Sizes**:
- Mobile: 375x667 (iPhone SE)
- Tablet: 768x1024 (iPad)
- Desktop: 1920x1080 (Full HD)

**Steps**:
1. Open browser dev tools
2. Enable responsive design mode
3. Test each screen size
4. Verify:
   - Forms are readable
   - Buttons are clickable
   - Text doesn't overflow
   - Layout adapts appropriately

**Checkpoints**:
- [ ] Mobile: Single column, touch-friendly
- [ ] Tablet: Comfortable reading, good spacing
- [ ] Desktop: Centered, max-width constrained

---

### Scenario 16: Browser Compatibility

**Objective**: Verify application works across browsers.

**Browsers to Test**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Test on Each Browser**:
1. Registration flow
2. Login flow
3. Session persistence
4. Logout flow

**Checkpoints**:
- [ ] All functionality works
- [ ] UI renders correctly
- [ ] No console errors
- [ ] Cookies work properly

---

### Scenario 17: Performance

**Objective**: Verify application performs well.

**Metrics to Check**:
- Page load time: < 2 seconds
- Middleware overhead: < 10ms
- API response time: < 500ms
- Time to Interactive: < 3 seconds

**Tools**:
- Chrome DevTools > Performance tab
- Network tab (timing)
- Lighthouse audit

**Checkpoints**:
- [ ] Fast page loads
- [ ] Quick API responses
- [ ] Smooth user interactions
- [ ] No lag or delays

---

### Scenario 18: Accessibility

**Objective**: Verify application is accessible.

**Checks**:
- [ ] All inputs have labels
- [ ] Tab navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] ARIA labels present

**Tools**:
- Chrome DevTools > Lighthouse > Accessibility
- Wave browser extension
- Screen reader testing (optional)

---

### Scenario 19: Error Recovery

**Objective**: Verify system handles errors gracefully.

**Test Cases**:

#### 19a. Network Error
1. Open Network tab
2. Enable "Offline" mode
3. Try to login
4. Verify error message

#### 19b. Slow Network
1. Throttle network to "Slow 3G"
2. Try to register
3. Verify loading states work
4. Verify no timeout errors

**Checkpoints**:
- [ ] Error messages clear
- [ ] Loading states work
- [ ] No crashes
- [ ] Graceful degradation

---

### Scenario 20: End-to-End Complete Flow

**Objective**: Test complete user journey from start to finish.

**Steps**:
1. Open fresh incognito window
2. Navigate to `http://localhost:3000/`
3. Redirected to `/login`
4. Click "Sign up"
5. Fill registration form completely
6. Submit registration
7. Redirected to home page
8. Verify logged in successfully
9. Refresh page
10. Verify session persists
11. Open new tab, navigate to `/`
12. Verify logged in in new tab
13. Click logout
14. Redirected to login
15. Try to access `/`
16. Redirected to login
17. Login with same credentials
18. Successful login
19. Redirected to home
20. Complete!

**Duration**: ~2-3 minutes

**Expected**: ✅ Entire flow works smoothly

---

## Test Summary Checklist

### Critical Flows (Must Pass)
- [ ] User registration
- [ ] User login
- [ ] Session persistence
- [ ] User logout
- [ ] Route protection

### Security (Must Pass)
- [ ] Passwords hashed
- [ ] HTTP-only cookies
- [ ] No password leakage
- [ ] CSRF protection
- [ ] Input validation

### UX (Should Pass)
- [ ] Clear error messages
- [ ] Loading states
- [ ] Responsive design
- [ ] Intuitive navigation
- [ ] Fast performance

### Compatibility (Should Pass)
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

---

## Bug Tracking

Use this template to report any issues found:

```
**Bug #**: [Number]
**Scenario**: [Which test scenario]
**Severity**: [Critical/High/Medium/Low]
**Steps to Reproduce**:
1. ...
2. ...
3. ...

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Screenshots**: [If applicable]
**Browser**: [Browser and version]
**Console Errors**: [Any errors in console]
```

---

## Post-Testing Actions

After completing all scenarios:

1. [ ] Document all bugs found
2. [ ] Fix critical bugs
3. [ ] Re-test fixed bugs
4. [ ] Update test status (pass/fail)
5. [ ] Sign off on testing phase
6. [ ] Proceed to production deployment

---

## Success Criteria

Phase 7 E2E testing is complete when:

- [ ] All 20 scenarios tested
- [ ] All critical flows pass
- [ ] All security checks pass
- [ ] No critical bugs remain
- [ ] At least 3 browsers tested
- [ ] Mobile responsiveness verified
- [ ] Performance acceptable
- [ ] Documentation updated

---

*This E2E testing guide ensures the authentication system is thoroughly validated before production deployment.*





