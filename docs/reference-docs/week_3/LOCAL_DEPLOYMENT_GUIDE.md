# Local Deployment Guide

**Date**: January 7, 2026  
**Status**: 🚀 Building and Deploying Locally

---

## What's Being Deployed

### Backend (Phases 1-3)

✅ **Phase 1: Database**
- Questions table with 10 columns
- Choices table with 6 columns
- 6 performance indexes
- Foreign key constraints
- **Database**: Local D1 (SQLite) at `.wrangler/state/v3/d1/`

✅ **Phase 2: Services**
- Question CRUD service functions
- Type-safe data conversions
- Zod validation schemas
- 22 unit tests (all passing)

✅ **Phase 3: API**
- 6 REST API endpoints at `/api/v1/questions`
- JWT authentication
- User authorization
- Request validation

### Frontend (Existing)

✅ **Authentication Pages**
- Login page at `/login`
- Registration page at `/register`
- Logout functionality

---

## Build Process

```bash
npm run preview
```

This command:
1. **Builds** the Next.js application
2. **Compiles** for Cloudflare Workers
3. **Starts** local Wrangler dev server
4. **Connects** to local D1 database

---

## What You Can Test After Deployment

### 1. User Authentication (Already Working)

**Register an Instructor**:
```bash
POST http://localhost:8788/api/auth/register
{
  "email": "teacher@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "instructor"
}
```

**Login**:
```bash
POST http://localhost:8788/api/auth/login
{
  "email": "teacher@example.com",
  "password": "Password123!"
}
```

### 2. Questions API (New - Phase 3)

**Create a Question** (after login):
```bash
POST http://localhost:8788/api/v1/questions
Content-Type: application/json
Cookie: session=<your-session-token>

{
  "title": "What is React?",
  "description": "Basic React concepts",
  "questionText": "React is primarily used for?",
  "questionType": "mcq_single",
  "points": 1,
  "difficulty": "medium",
  "choices": [
    {
      "choiceText": "Backend development",
      "isCorrect": false,
      "displayOrder": 1
    },
    {
      "choiceText": "Frontend UI development",
      "isCorrect": true,
      "displayOrder": 2
    },
    {
      "choiceText": "Database management",
      "isCorrect": false,
      "displayOrder": 3
    }
  ]
}
```

**List Questions**:
```bash
GET http://localhost:8788/api/v1/questions?page=1&limit=10&sortBy=created_at&sortOrder=desc
Cookie: session=<your-session-token>
```

**Get Single Question**:
```bash
GET http://localhost:8788/api/v1/questions/{question-id}
Cookie: session=<your-session-token>
```

**Update Question**:
```bash
PUT http://localhost:8788/api/v1/questions/{question-id}
Content-Type: application/json
Cookie: session=<your-session-token>

{
  "title": "Updated Title",
  "choices": [...]
}
```

**Delete Question**:
```bash
DELETE http://localhost:8788/api/v1/questions/{question-id}
Cookie: session=<your-session-token>
```

**Validate Answer** (for preview):
```bash
POST http://localhost:8788/api/v1/questions/{question-id}/validate
Content-Type: application/json
Cookie: session=<your-session-token>

{
  "selectedChoiceId": "choice-id"
}
```

---

## Testing with Browser

### 1. Register & Login

1. Open browser: `http://localhost:8788`
2. Click "Register" or go to `http://localhost:8788/register`
3. Register as instructor:
   - Email: `teacher@example.com`
   - Password: `Password123!`
   - First Name: `John`
   - Last Name: `Doe`
   - Role: `Instructor`
4. Login with credentials

### 2. Test API with Browser DevTools

Once logged in, open DevTools Console and test:

```javascript
// Create a question
const response = await fetch('/api/v1/questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Test Question",
    questionText: "What is 2+2?",
    questionType: "mcq_single",
    choices: [
      { choiceText: "3", isCorrect: false, displayOrder: 1 },
      { choiceText: "4", isCorrect: true, displayOrder: 2 },
      { choiceText: "5", isCorrect: false, displayOrder: 3 }
    ]
  })
});
const data = await response.json();
console.log(data);

// List questions
const listResponse = await fetch('/api/v1/questions?page=1&limit=10');
const listData = await listResponse.json();
console.log(listData);
```

---

## Testing with curl

### Register User
```bash
curl -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"teacher@example.com\",\"password\":\"Password123!\",\"firstName\":\"John\",\"lastName\":\"Doe\",\"role\":\"instructor\"}"
```

### Login
```bash
curl -X POST http://localhost:8788/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{\"email\":\"teacher@example.com\",\"password\":\"Password123!\"}"
```

### Create Question
```bash
curl -X POST http://localhost:8788/api/v1/questions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{\"title\":\"Test Question\",\"questionText\":\"What is React?\",\"questionType\":\"mcq_single\",\"choices\":[{\"choiceText\":\"Backend\",\"isCorrect\":false,\"displayOrder\":1},{\"choiceText\":\"Frontend\",\"isCorrect\":true,\"displayOrder\":2}]}"
```

### List Questions
```bash
curl -X GET "http://localhost:8788/api/v1/questions?page=1&limit=10" \
  -b cookies.txt
```

---

## Testing with Postman

1. **Import Collection**:
   - Create new collection "QuizMaker API"
   - Add base URL: `http://localhost:8788`

2. **Register Request**:
   - Method: POST
   - URL: `{{base_url}}/api/auth/register`
   - Body (JSON): Registration data
   - Tests: Save session cookie

3. **Login Request**:
   - Method: POST
   - URL: `{{base_url}}/api/auth/login`
   - Body (JSON): Login credentials
   - Tests: Save session cookie

4. **Questions Requests**:
   - All requests automatically use saved cookie
   - Test all 6 endpoints

---

## Expected Server Output

When the server starts, you should see:

```
✓ Build completed successfully
Starting local Cloudflare Workers development server...
⎔ Starting local server...
⎔ Listening on http://localhost:8788
⬣ Connected to local D1 database: quizmaker-database

Ready! Server is running at:
  → http://localhost:8788
```

---

## Directory Structure

```
.wrangler/
├── state/v3/d1/
│   └── quizmaker-database.sqlite  (local D1 database)
└── tmp/
    └── dev-*/  (temp files)

.open-next/
├── worker.js  (Cloudflare Worker)
├── assets/    (Static files)
└── cache/     (Build cache)
```

---

## Database Verification

Check local database:

```bash
# List tables
npx wrangler d1 execute quizmaker-database --local \
  --command "SELECT name FROM sqlite_master WHERE type='table';"

# View questions
npx wrangler d1 execute quizmaker-database --local \
  --command "SELECT * FROM questions;"

# View choices
npx wrangler d1 execute quizmaker-database --local \
  --command "SELECT * FROM choices;"
```

---

## Troubleshooting

### Port Already in Use

If port 8788 is busy:
```bash
# Find process using port
netstat -ano | findstr :8788

# Kill process
taskkill /PID <process-id> /F
```

### Build Errors

If build fails:
```bash
# Clean build cache
rm -rf .next .open-next

# Reinstall dependencies
npm install

# Try again
npm run preview
```

### Database Not Found

If database errors:
```bash
# Reapply migrations
npx wrangler d1 migrations apply quizmaker-database --local
```

### Session Errors

If JWT errors:
- Check `.dev.vars` has `SESSION_SECRET`
- Ensure session cookie is being sent
- Check cookie is not expired

---

## What's NOT Included Yet

These will be implemented in Phases 4-8:

❌ Questions dashboard UI (Phase 4)
❌ Question creation form (Phase 5)
❌ Question preview page (Phase 6)
❌ Question edit page (Phase 7)
❌ Student "Coming Soon" view (Phase 8)

**You can only test via API calls** (browser console, curl, Postman) for now.

---

## Next Steps After Testing

1. **Test all API endpoints** to verify they work
2. **Check database** to see data is stored correctly
3. **Verify authentication** is working
4. **Test authorization** (users can only access own questions)
5. **Proceed to Phase 4** to build the UI

---

## Quick Test Checklist

- [ ] Server starts without errors
- [ ] Can access http://localhost:8788
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Can create question via API
- [ ] Can list questions via API
- [ ] Can get single question via API
- [ ] Can update question via API
- [ ] Can delete question via API
- [ ] Can validate answer via API
- [ ] Database contains created questions
- [ ] Authorization works (can't access others' questions)

---

**Status**: 🚀 Deploying locally for testing...

