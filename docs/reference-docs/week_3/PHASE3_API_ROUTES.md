# Phase 3: API Routes with Versioning - Implementation Summary

**Phase**: 3 of 8  
**Status**: ✅ COMPLETED  
**Date**: January 7, 2026  
**Objective**: Create versioned REST API endpoints that expose backend services to frontend

---

## Deliverables Created

### 1. Authentication Helper Utilities
**File**: `lib/utils/auth-helpers.ts`

**Purpose**: Helper functions for extracting and verifying user sessions from API requests.

**Key Functions**:

```typescript
// Extract and verify session from request
async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionPayload | null>

// Check if user has specific role
function hasRole(
  session: SessionPayload,
  allowedRoles: Array<'instructor' | 'student'>
): boolean

// Standard error responses
const AUTH_ERRORS = {
  UNAUTHORIZED: { /* ... */ },
  FORBIDDEN: { /* ... */ },
  INVALID_TOKEN: { /* ... */ },
}
```

**Features**:
- Extracts JWT token from HTTP-only cookies
- Verifies token using existing session utilities
- Provides role-based authorization checks
- Standardized error responses

---

### 2. Questions List & Create API
**File**: `src/app/api/v1/questions/route.ts`

**Endpoints**:

#### GET /api/v1/questions
Get paginated list of user's questions.

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sortBy`: Field to sort by - `title`, `created_at`, `updated_at` (default: `created_at`)
- `sortOrder`: Sort order - `asc` or `desc` (default: `desc`)

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "question-123",
      "userId": "user-123",
      "questionType": "mcq_single",
      "title": "What is React?",
      "description": "Basic React concepts",
      "questionText": "React is primarily used for?",
      "points": 1,
      "difficulty": "medium",
      "createdAt": "2026-01-07T10:00:00Z",
      "updatedAt": "2026-01-07T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Not logged in
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Server error

#### POST /api/v1/questions
Create a new question with choices.

**Request Body**:
```json
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
      "choiceText": "Frontend UI",
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

**Response (201)**:
```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "id": "generated-id-123",
    "userId": "user-123",
    "questionType": "mcq_single",
    "title": "What is React?",
    "description": "Basic React concepts",
    "questionText": "React is primarily used for?",
    "points": 1,
    "difficulty": "medium",
    "createdAt": "2026-01-07T10:00:00Z",
    "updatedAt": "2026-01-07T10:00:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Not logged in
- `400 Bad Request`: Validation failed (details included)
- `500 Internal Server Error`: Server error

---

### 3. Individual Question Operations API
**File**: `src/app/api/v1/questions/[id]/route.ts`

**Endpoints**:

#### GET /api/v1/questions/:id
Get a single question with all its choices.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "question-123",
    "userId": "user-123",
    "questionType": "mcq_single",
    "title": "What is React?",
    "description": "Basic React concepts",
    "questionText": "React is primarily used for?",
    "points": 1,
    "difficulty": "medium",
    "createdAt": "2026-01-07T10:00:00Z",
    "updatedAt": "2026-01-07T10:00:00Z",
    "choices": [
      {
        "id": "choice-1",
        "questionId": "question-123",
        "choiceText": "Backend development",
        "isCorrect": false,
        "displayOrder": 1,
        "createdAt": "2026-01-07T10:00:00Z"
      },
      {
        "id": "choice-2",
        "questionId": "question-123",
        "choiceText": "Frontend UI",
        "isCorrect": true,
        "displayOrder": 2,
        "createdAt": "2026-01-07T10:00:00Z"
      }
    ]
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Not logged in
- `404 Not Found`: Question not found or no permission
- `500 Internal Server Error`: Server error

#### PUT /api/v1/questions/:id
Update an existing question.

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "questionText": "Updated question text",
  "questionType": "mcq_single",
  "points": 2,
  "difficulty": "hard",
  "choices": [
    {
      "choiceText": "New choice 1",
      "isCorrect": false,
      "displayOrder": 1
    },
    {
      "choiceText": "New choice 2",
      "isCorrect": true,
      "displayOrder": 2
    }
  ]
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "id": "question-123",
    "userId": "user-123",
    "title": "Updated Title",
    ...
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Not logged in
- `404 Not Found`: Question not found or no permission
- `400 Bad Request`: Validation failed
- `500 Internal Server Error`: Server error

#### DELETE /api/v1/questions/:id
Delete a question and all its choices.

**Response (200)**:
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: Not logged in
- `404 Not Found`: Question not found or no permission
- `500 Internal Server Error`: Server error

---

### 4. Answer Validation API
**File**: `src/app/api/v1/questions/[id]/validate/route.ts`

**Endpoint**:

#### POST /api/v1/questions/:id/validate
Validate a user's answer selection for preview/testing.

**Request Body**:
```json
{
  "selectedChoiceId": "choice-2"
}
```

**Response (200)** - Correct Answer:
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctChoiceId": "choice-2",
    "selectedChoiceId": "choice-2"
  }
}
```

**Response (200)** - Incorrect Answer:
```json
{
  "success": true,
  "data": {
    "isCorrect": false,
    "correctChoiceId": "choice-2",
    "selectedChoiceId": "choice-1"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Not logged in
- `404 Not Found`: Choice not found
- `400 Bad Request`: Invalid request body
- `500 Internal Server Error`: Server error

---

## Key Features Implemented

### 1. API Versioning
- All endpoints use `/api/v1/` prefix
- Future versions can be added without breaking existing clients
- Industry-standard API evolution pattern

### 2. Authentication & Authorization
- **Authentication**: JWT token verification on every request
- **Authorization**: User ownership verification for all operations
- Users can only access/modify their own questions
- Consistent error responses for auth failures

### 3. Request Validation
- Zod schemas validate all incoming data
- Detailed validation error messages
- Type-safe request handling

### 4. Response Standardization
- Consistent response format across all endpoints
- Success responses include `success: true`
- Error responses include `success: false` + error details
- HTTP status codes follow REST conventions

### 5. Error Handling
- Graceful error handling throughout
- Specific error messages for different scenarios
- Proper HTTP status codes (401, 403, 404, 400, 500)
- Error logging for debugging

### 6. Pagination & Sorting
- Efficient pagination for list queries
- Configurable page size (max 100)
- Sortable by multiple fields
- Metadata includes total pages/items

---

## API Route Structure

```
src/app/api/v1/
└── questions/
    ├── route.ts (GET list, POST create)
    └── [id]/
        ├── route.ts (GET single, PUT update, DELETE)
        └── validate/
            └── route.ts (POST validate answer)
```

---

## HTTP Status Codes Used

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, DELETE |
| 201 | Successful POST (created) |
| 400 | Bad Request (validation failed) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (wrong role) |
| 404 | Not Found (resource doesn't exist or no access) |
| 500 | Internal Server Error |

---

## Authentication Flow

```
Client Request
    ↓
Extract JWT from cookies
    ↓
Verify JWT signature & expiration
    ↓
Extract userId & role from token
    ↓
Check authorization (ownership)
    ↓
Execute operation
    ↓
Return response
```

---

## File Structure After Phase 3

```
lib/utils/
└── auth-helpers.ts (new) ✅
    ├── getSessionFromRequest()
    ├── hasRole()
    └── AUTH_ERRORS

src/app/api/v1/
└── questions/
    ├── route.ts (new) ✅
    │   ├── GET (list with pagination)
    │   └── POST (create)
    │
    └── [id]/
        ├── route.ts (new) ✅
        │   ├── GET (single question)
        │   ├── PUT (update)
        │   └── DELETE (delete)
        │
        └── validate/
            └── route.ts (new) ✅
                └── POST (validate answer)
```

---

## Testing the API

### Using curl

**Login first** (from existing auth):
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"password123"}' \
  -c cookies.txt
```

**Create a question**:
```bash
curl -X POST http://localhost:3000/api/v1/questions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "What is React?",
    "questionText": "React is used for?",
    "questionType": "mcq_single",
    "choices": [
      {"choiceText": "Backend", "isCorrect": false, "displayOrder": 1},
      {"choiceText": "Frontend", "isCorrect": true, "displayOrder": 2}
    ]
  }'
```

**List questions**:
```bash
curl -X GET "http://localhost:3000/api/v1/questions?page=1&limit=10" \
  -b cookies.txt
```

**Get single question**:
```bash
curl -X GET http://localhost:3000/api/v1/questions/{id} \
  -b cookies.txt
```

**Update question**:
```bash
curl -X PUT http://localhost:3000/api/v1/questions/{id} \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title": "Updated Title"}'
```

**Delete question**:
```bash
curl -X DELETE http://localhost:3000/api/v1/questions/{id} \
  -b cookies.txt
```

**Validate answer**:
```bash
curl -X POST http://localhost:3000/api/v1/questions/{id}/validate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"selectedChoiceId": "choice-id"}'
```

---

## Phase 3 Completion Checklist

- [x] Create authentication helper utilities
- [x] Implement POST /api/v1/questions (create)
- [x] Implement GET /api/v1/questions (list with pagination)
- [x] Implement GET /api/v1/questions/:id (get single)
- [x] Implement PUT /api/v1/questions/:id (update)
- [x] Implement DELETE /api/v1/questions/:id (delete)
- [x] Implement POST /api/v1/questions/:id/validate (validate)
- [x] Add JWT authentication to all endpoints
- [x] Add ownership authorization checks
- [x] Implement consistent error handling
- [x] Use Zod for request validation
- [x] Return standardized response format
- [x] Add proper HTTP status codes
- [x] Document all endpoints
- [x] Zero linting errors

---

## Security Features

### 1. Authentication
- JWT tokens stored in HTTP-only cookies (not accessible via JavaScript)
- Token verification on every request
- Tokens expire after 7 days
- Signed with HS256 algorithm

### 2. Authorization
- User ownership verification on all operations
- Users cannot access other users' questions
- Role-based access control ready (via hasRole helper)

### 3. Input Validation
- All inputs validated with Zod schemas
- SQL injection prevention via prepared statements
- XSS prevention via proper encoding

### 4. Error Handling
- No sensitive information leaked in errors
- Generic error messages to clients
- Detailed error logging for debugging

---

## Next Steps

✅ **Phase 3: API Routes with Versioning - COMPLETED**

**Ready for Phase 4: MCQ Dashboard (List View)**

Phase 4 will include:
- Main questions dashboard page at `/dashboard/questions`
- Questions table with shadcn/ui components
- Sorting and pagination UI
- "Create Question" button
- Action menu (Preview, Edit, Delete)
- Delete confirmation dialog
- Role guard for instructor-only access
- Loading and empty states

---

## Summary

Phase 3 has successfully created a complete REST API layer for question management. All endpoints are authenticated, authorized, validated, and return consistent responses. The API follows industry best practices and is ready for frontend integration.

**Key Achievements**:
- ✅ 4 new files created (auth helpers + 3 API routes)
- ✅ 6 API endpoints implemented
- ✅ Full authentication & authorization
- ✅ Request validation with Zod
- ✅ Standardized responses
- ✅ Proper error handling
- ✅ Zero linting errors
- ✅ Well documented

**Lines of Code**: ~600+ lines
**API Endpoints**: 6 endpoints (3 routes)
**Ready for**: Phase 4 UI implementation

