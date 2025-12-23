# Phase 7: Production Deployment Guide

**Purpose**: Step-by-step guide to deploy QuizMaker authentication system to Cloudflare Workers.

---

## Pre-Deployment Checklist

### Code Quality
- [x] All tests passing (92/92) ✅
- [x] No linter errors ✅
- [x] No TypeScript errors ✅
- [x] Security audit completed ✅
- [x] E2E test scenarios documented ✅

### Environment
- [ ] Cloudflare account active
- [ ] wrangler CLI installed
- [ ] Authenticated with Cloudflare
- [ ] Production D1 database exists
- [ ] Domain configured (optional)

### Documentation
- [x] Technical PRD complete ✅
- [x] Phase summaries complete (1-6) ✅
- [x] API testing guide created ✅
- [x] E2E test scenarios created ✅
- [x] Security audit complete ✅

---

## Step 1: Verify Local Environment

### 1.1 Run All Tests

```bash
npm test -- --run
```

**Expected Output**:
```
Test Files  7 passed (7)
     Tests  92 passed (92)
```

✅ **Checkpoint**: All 92 tests must pass.

---

### 1.2 Run Lint Check

```bash
npm run lint
```

**Expected Output**: No errors

✅ **Checkpoint**: No linter errors.

---

### 1.3 Build Application

```bash
npm run build
```

**Expected Output**: Build completes successfully

✅ **Checkpoint**: No build errors.

---

## Step 2: Cloudflare Setup

### 2.1 Verify Cloudflare Login

```bash
npx wrangler whoami
```

**Expected Output**:
```
You are logged in with an OAuth Token, associated with the email '[your-email]'!
```

**If not logged in**:
```bash
npx wrangler login
```

✅ **Checkpoint**: Successfully authenticated.

---

### 2.2 Verify D1 Database

```bash
npx wrangler d1 list
```

**Expected Output**: Should show `quizmaker-database`

**If database doesn't exist**:
```bash
npx wrangler d1 create quizmaker-database
```

✅ **Checkpoint**: Database exists and is accessible.

---

### 2.3 Check Database Configuration

Review `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "quizmaker-database",
      "database_id": "[your-database-id]"
    }
  ]
}
```

✅ **Checkpoint**: Database ID matches your D1 database.

---

## Step 3: Database Migration (Production)

### 3.1 Review Migration File

Check `migrations/0001_create_users_table.sql`:

```sql
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

✅ **Checkpoint**: Migration file is correct.

---

### 3.2 List Existing Migrations

```bash
npx wrangler d1 migrations list quizmaker-database --remote
```

**Expected Output**: Shows applied migrations (may be empty if first time)

---

### 3.3 Apply Migration to Production

⚠️ **WARNING**: This will modify your production database!

```bash
npx wrangler d1 migrations apply quizmaker-database --remote
```

**Expected Output**:
```
Migrations to be applied:
  └ 0001_create_users_table.sql
Ok to apply? (y/n)
```

Type `y` and press Enter.

**Success Output**:
```
✔ Successfully applied 1 migration!
```

✅ **Checkpoint**: Migration applied successfully.

---

### 3.4 Verify Production Database

```bash
npx wrangler d1 execute quizmaker-database --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

**Expected Output**: Shows `users` table

```bash
npx wrangler d1 execute quizmaker-database --remote --command="PRAGMA table_info(users);"
```

**Expected Output**: Shows all columns (id, email, password_hash, etc.)

✅ **Checkpoint**: Database schema is correct.

---

## Step 4: Production Secrets

### 4.1 Generate Strong SESSION_SECRET

**Option A: Using OpenSSL (Linux/Mac)**:
```bash
openssl rand -base64 32
```

**Option B: Using Node.js (Cross-platform)**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example Output**:
```
IKOGt8wjXAuYHpYiXglAMuAqD2LWaH0NbrG53BAfYao=
```

⚠️ **Important**: 
- Use a different secret for production than development!
- Keep this secret secure
- Never commit to Git

---

### 4.2 Set Production SECRET

```bash
npx wrangler secret put SESSION_SECRET
```

**Prompt**:
```
Enter a secret value:
```

Paste your generated secret and press Enter.

**Success Output**:
```
✔ Successfully created secret for script quizmaker-app!
```

✅ **Checkpoint**: SESSION_SECRET set in production.

---

### 4.3 Verify Secrets (Optional)

```bash
npx wrangler secret list
```

**Expected Output**: Shows `SESSION_SECRET` (value hidden)

---

## Step 5: Deploy to Cloudflare Workers

### 5.1 Build and Deploy

```bash
npm run deploy
```

**This command will**:
1. Build the Next.js application
2. Package for Cloudflare Workers
3. Upload to Cloudflare
4. Deploy to production

**Expected Output**:
```
✔ Built application
✔ Uploaded to Cloudflare
✔ Deployed successfully

Preview URL: https://quizmaker-app.[your-subdomain].workers.dev
```

✅ **Checkpoint**: Deployment successful.

---

### 5.2 Note Your Production URL

Your application is now live at:
```
https://[your-worker-name].[your-subdomain].workers.dev
```

Or your custom domain if configured.

---

## Step 6: Post-Deployment Verification

### 6.1 Test Login Page

```bash
curl -I https://[your-worker-name].[your-subdomain].workers.dev/login
```

**Expected**: HTTP 200 OK

---

### 6.2 Test Registration API

```bash
curl -X POST https://[your-worker-name].[your-subdomain].workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "instructor"
  }'
```

**Expected**: 201 Created with user object

---

### 6.3 Test Login API

```bash
curl -X POST https://[your-worker-name].[your-subdomain].workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com",
    "password": "TestPass123!"
  }' \
  -c cookies.txt \
  -i
```

**Expected**: 
- 200 OK
- Set-Cookie header present
- User object returned

---

### 6.4 Test Protected Route

```bash
curl -X GET https://[your-worker-name].[your-subdomain].workers.dev/api/auth/session \
  -b cookies.txt
```

**Expected**: 200 OK with user data

---

### 6.5 Test Logout

```bash
curl -X POST https://[your-worker-name].[your-subdomain].workers.dev/api/auth/logout \
  -b cookies.txt \
  -i
```

**Expected**: 
- 200 OK
- Set-Cookie with empty value (cookie cleared)

---

## Step 7: Browser Testing

### 7.1 Basic Flow Test

1. Open production URL in browser
2. Should redirect to `/login`
3. Click "Sign up"
4. Register a new user
5. Should redirect to home page
6. Verify logged in
7. Logout
8. Should redirect to login

✅ **Checkpoint**: Complete flow works.

---

### 7.2 Session Persistence

1. Login successfully
2. Refresh the page
3. Should still be logged in
4. Open new tab
5. Navigate to production URL
6. Should still be logged in

✅ **Checkpoint**: Sessions persist.

---

### 7.3 Middleware Protection

1. Logout
2. Try to access home page directly
3. Should redirect to login
4. Login successfully
5. Try to access `/login`
6. Should redirect to home

✅ **Checkpoint**: Middleware works.

---

## Step 8: Performance Check

### 8.1 Lighthouse Audit

1. Open Chrome DevTools
2. Navigate to Lighthouse tab
3. Run audit on production URL
4. Check scores:
   - Performance: > 90
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 80

---

### 8.2 Load Time Check

1. Open Network tab
2. Navigate to login page
3. Check page load time: < 2 seconds
4. Check Time to Interactive: < 3 seconds

✅ **Checkpoint**: Performance acceptable.

---

## Step 9: Security Verification

### 9.1 HTTPS Check

```bash
curl -I https://[your-worker-name].[your-subdomain].workers.dev/
```

**Expected**: Connection over HTTPS ✅

---

### 9.2 Cookie Security

1. Login to production
2. Open Application > Cookies
3. Check `session` cookie:
   - HttpOnly: ✅ true
   - Secure: ✅ true (production)
   - SameSite: Lax
   - Expires: 7 days

✅ **Checkpoint**: Cookies secure.

---

### 9.3 No Password Leakage

1. Register/Login
2. Check Network responses
3. Verify no passwords in any response

✅ **Checkpoint**: No password leakage.

---

## Step 10: Monitoring Setup

### 10.1 Enable Cloudflare Analytics

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. Enable Analytics
5. Set up alerts for errors

---

### 10.2 Error Logging

```bash
npx wrangler tail [your-worker-name]
```

**This shows real-time logs from production.**

Monitor for:
- Authentication errors
- Database errors
- Unexpected errors

---

## Step 11: Custom Domain (Optional)

### 11.1 Add Custom Domain

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. Go to "Custom Domains"
5. Click "Add Custom Domain"
6. Enter your domain (e.g., `quizmaker.example.com`)
7. DNS records auto-configured

---

### 11.2 Verify Custom Domain

```bash
curl -I https://quizmaker.example.com/
```

**Expected**: HTTP 200 OK

✅ **Checkpoint**: Custom domain works.

---

## Rollback Procedure

### If Something Goes Wrong

#### Rollback Deployment

```bash
# List recent deployments
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback [deployment-id]
```

#### Rollback Database Migration

⚠️ **Database rollbacks are risky!**

If you need to rollback:
1. Don't delete data
2. Create new migration to undo changes
3. Test thoroughly in development first

---

## Troubleshooting

### Issue: 500 Internal Server Error

**Check**:
1. SESSION_SECRET set correctly
2. Database binding configured
3. Migration applied
4. Check worker logs: `npx wrangler tail`

---

### Issue: Cookie Not Being Set

**Check**:
1. HTTPS enabled (production)
2. Domain matches
3. No browser restrictions
4. Check Network > Headers

---

### Issue: Database Connection Error

**Check**:
1. Database exists
2. Binding name correct (`DB`)
3. Database ID in wrangler.jsonc
4. Migration applied

---

### Issue: Authentication Not Working

**Check**:
1. SESSION_SECRET set in production
2. Middleware deployed
3. Cookies enabled in browser
4. No CORS issues

---

## Post-Deployment Checklist

### Immediate (Within 1 hour)
- [ ] All API endpoints respond correctly
- [ ] Registration flow works
- [ ] Login flow works
- [ ] Logout works
- [ ] Session persistence works
- [ ] Middleware protects routes
- [ ] HTTPS enabled
- [ ] Cookies secure

### Short-term (Within 24 hours)
- [ ] Monitor error logs
- [ ] Check analytics
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Verify performance
- [ ] Check database growth

### Long-term (Weekly)
- [ ] Review error logs
- [ ] Monitor user registrations
- [ ] Check for security issues
- [ ] Review analytics
- [ ] Plan Phase 8 (MCQ features)

---

## Success Criteria

Production deployment is successful when:

- [x] Application deployed to Cloudflare Workers
- [x] Database migration applied
- [x] SESSION_SECRET configured
- [x] All API endpoints working
- [x] Complete authentication flow functional
- [x] HTTPS enabled
- [x] Cookies secure
- [x] Session persistence working
- [x] Middleware protecting routes
- [x] No critical errors
- [x] Performance acceptable
- [x] Monitoring enabled

---

## Next Steps After Deployment

1. **Monitor**: Watch logs for first 24 hours
2. **Test**: Complete E2E testing in production
3. **Document**: Note any production-specific issues
4. **Communicate**: Inform stakeholders of go-live
5. **Plan Phase 8**: Begin MCQ features development

---

## Emergency Contacts

**If critical issue occurs**:

1. Check Cloudflare status: https://www.cloudflarestatus.com/
2. Review worker logs: `npx wrangler tail`
3. Rollback if needed: `npx wrangler rollback`
4. Escalate to team if unresolved

---

## Deployment Summary Template

Use this template to document your deployment:

```
# Production Deployment - [Date]

**Deployed By**: [Name]
**Date/Time**: [YYYY-MM-DD HH:MM]
**Environment**: Production
**Worker URL**: [URL]

## Pre-Deployment
- Tests: ✅ All 92 passed
- Lint: ✅ No errors
- Build: ✅ Successful
- Security Audit: ✅ Passed

## Deployment
- Database Migration: ✅ Applied
- Secrets: ✅ Configured
- Deployment: ✅ Successful
- URL: https://[your-worker].workers.dev

## Post-Deployment
- API Tests: ✅ All passing
- Browser Tests: ✅ Functional
- Performance: ✅ Acceptable
- Security: ✅ Verified
- Monitoring: ✅ Enabled

## Issues
- [None or list any issues found]

## Sign-Off
- Deployment successful: ✅ YES
- Ready for users: ✅ YES
- Monitoring enabled: ✅ YES
```

---

*This production deployment guide ensures a smooth, secure, and verified deployment to Cloudflare Workers.*





