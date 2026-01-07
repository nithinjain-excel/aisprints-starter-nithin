# MCQ Authoring - Technical PRD

## ✅ Implementation Status: COMPLETE

**All 8 phases successfully implemented and production-ready!**

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ COMPLETED | Database schema (questions + choices tables) |
| Phase 2 | ✅ COMPLETED | Backend services (CRUD operations) |
| Phase 3 | ✅ COMPLETED | API routes with versioning (/api/v1/questions) |
| Phase 4 | ✅ COMPLETED | Questions dashboard with table |
| Phase 5 | ✅ COMPLETED | Question creation flow |
| Phase 6 | ✅ COMPLETED | Question preview with validation |
| Phase 7 | ✅ COMPLETED | Question edit functionality |
| Phase 8 | ✅ COMPLETED | Role-based access control |

**Build Status**: ✅ Successful (Zero TypeScript errors, 14 routes generated)  
**Last Updated**: January 8, 2026  
**Documentation**: See [PHASES_5-8_IMPLEMENTATION_SUMMARY.md](./PHASES_5-8_IMPLEMENTATION_SUMMARY.md) for detailed implementation summary.

---

## Overview

This document outlines the requirements for implementing Multiple Choice Question (MCQ) authoring functionality in the QuizMaker application. The system enables instructors to create, manage, and preview MCQ questions with single correct answers, while providing a foundation for future question type extensions. Students see a "Coming soon" message as they do not have access to this feature yet.

---

## Business Requirements

### User Access Control
- Instructors can access the MCQ authoring dashboard after login
- Students see a "Coming soon" message and cannot access MCQ authoring features
- All questions are associated with the instructor who created them
- Users can only view, edit, and delete their own questions

### MCQ Creation
- Instructors can create new MCQ questions with title, description, and question text
- Each question must have a minimum of 2 choices and a maximum of 6 choices
- Instructors must select exactly one choice as the correct answer
- The "Add Choice" button is disabled after 6 choices are added
- After successful creation, users are redirected to the questions table

### MCQ Management
- Instructors can view all their created questions in a paginated table
- Table displays: title, description, question, and action menus
- Table supports sorting by columns
- Pagination shows 10 questions per page
- Action menu provides: Preview, Edit, and Delete options

### MCQ Preview
- Instructors can preview questions to test functionality
- Preview page displays the question with all choices
- Users can select an answer and submit to see if it's correct
- UI clearly indicates correct vs incorrect answer selection

### MCQ Editing
- Instructors can edit existing questions
- Edit page pre-fills all existing data
- Same validation rules apply as creation
- After successful edit, users return to the questions table

### MCQ Deletion
- Instructors can delete questions via the action menu
- Deletion requires confirmation
- Deleting a question removes all associated choices

---

## Technical Requirements

### Database Schema

The database schema is designed to support the current MCQ with single answer requirement while being extensible for future question types (MCQ with multiple answers, True/False, Fill in the blanks).

```sql
-- Questions table: stores all question types
CREATE TABLE questions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq_single',
  title TEXT NOT NULL,
  description TEXT,
  question_text TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);

-- Choices table: stores answer choices for MCQ questions
CREATE TABLE choices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  question_id TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_choices_question_id ON choices(question_id);
CREATE INDEX idx_choices_display_order ON choices(question_id, display_order);
```

**Schema Design Notes**:
- `question_type` field supports extensibility: 'mcq_single', 'mcq_multiple', 'true_false', 'fill_blank'
- `is_correct` is INTEGER (0/1) for SQLite boolean support
- `display_order` allows choices to be displayed in a specific order
- Cascading deletes ensure data integrity
- `points` and `difficulty` fields support future grading features

**SQLite to TypeScript Data Type Mapping**:
- `TEXT` → `string` (for id, user_id, question_type, title, description, question_text, difficulty, choice_text)
- `INTEGER` → `number` (for points, is_correct, display_order)
- `INTEGER` (0/1) → `boolean` (for is_correct field, converted in application layer)
- `DATETIME` → `Date` or `string` (SQLite stores as TEXT in ISO8601 format "YYYY-MM-DD HH:MM:SS.SSS", convert to Date object or ISO string in TypeScript)

**Data Type Conversion Rules**:
- When reading from DB: Convert INTEGER (0/1) to boolean using `!!value` or `value === 1`
- When writing to DB: Convert boolean to INTEGER using `value ? 1 : 0`
- Dates: SQLite CURRENT_TIMESTAMP returns ISO8601 format, parse to Date object or return as ISO string
- Nullable fields: Use `null` in TypeScript for optional TEXT/INTEGER columns

### API Endpoints

**API Versioning**: All endpoints use versioning pattern `/api/v1/...` for future compatibility and easier API evolution.

#### POST /api/v1/questions
Create a new MCQ question with choices.

**Request Body:**
```json
{
  "title": "Introduction to Variables",
  "description": "Basic programming concepts",
  "questionText": "What is a variable in programming?",
  "questionType": "mcq_single",
  "choices": [
    {
      "choiceText": "A container for storing data",
      "isCorrect": true,
      "displayOrder": 1
    },
    {
      "choiceText": "A function",
      "isCorrect": false,
      "displayOrder": 2
    }
  ]
}
```

**Response:**
- Success (200): 
```json
{
  "success": true,
  "question": {
    "id": "abc123",
    "title": "Introduction to Variables",
    "questionType": "mcq_single",
    "createdAt": "2026-01-06T10:00:00Z"
  }
}
```
- Error (400): Validation error (missing fields, invalid choice count, no correct answer)
- Error (401): Unauthorized (user not logged in)
- Error (500): Server error

#### GET /api/v1/questions
Get paginated list of user's questions.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Column to sort by (default: 'created_at')
- `sortOrder`: 'asc' or 'desc' (default: 'desc')

**Response:**
- Success (200):
```json
{
  "success": true,
  "questions": [
    {
      "id": "abc123",
      "title": "Introduction to Variables",
      "description": "Basic programming concepts",
      "questionText": "What is a variable?",
      "questionType": "mcq_single",
      "createdAt": "2026-01-06T10:00:00Z"
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
- Error (401): Unauthorized
- Error (500): Server error

#### GET /api/v1/questions/:id
Get a specific question with all choices.

**Response:**
- Success (200):
```json
{
  "success": true,
  "question": {
    "id": "abc123",
    "title": "Introduction to Variables",
    "description": "Basic programming concepts",
    "questionText": "What is a variable?",
    "questionType": "mcq_single",
    "choices": [
      {
        "id": "choice1",
        "choiceText": "A container for storing data",
        "isCorrect": true,
        "displayOrder": 1
      }
    ]
  }
}
```
- Error (401): Unauthorized
- Error (404): Question not found or access denied
- Error (500): Server error

#### PUT /api/v1/questions/:id
Update an existing question.

**Request Body:** Same as POST /api/v1/questions

**Response:**
- Success (200): Updated question object
- Error (400): Validation error
- Error (401): Unauthorized
- Error (404): Question not found or access denied
- Error (500): Server error

#### DELETE /api/v1/questions/:id
Delete a question and all associated choices.

**Response:**
- Success (200): 
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```
- Error (401): Unauthorized
- Error (404): Question not found or access denied
- Error (500): Server error

#### POST /api/v1/questions/:id/validate
Validate a user's answer for preview functionality.

**Request Body:**
```json
{
  "selectedChoiceId": "choice1"
}
```

**Response:**
- Success (200):
```json
{
  "success": true,
  "isCorrect": true,
  "correctChoiceId": "choice1",
  "explanation": "Correct! A variable is a container for storing data."
}
```
- Error (400): Invalid choice ID
- Error (401): Unauthorized
- Error (404): Question not found
- Error (500): Server error

### User Interface Requirements

#### MCQ Dashboard (/dashboard/questions)
- **Access**: Instructor role only
- **Layout**: 
  - Header with "Create Question" button (top-right)
  - Questions table below header
  - Pagination controls at bottom
- **Table Columns**:
  - Title (sortable)
  - Description (truncated with tooltip)
  - Question (truncated with tooltip)
  - Actions (dropdown menu: Preview, Edit, Delete)
- **Features**:
  - Sortable columns (click header to sort)
  - 10 items per page
  - Page navigation (Previous, 1, 2, 3, Next)
  - Empty state when no questions exist
  - Loading state while fetching data
- **Components**: Use shadcn/ui Table, Button, DropdownMenu

#### MCQ Creation Page (/dashboard/questions/create)
- **Access**: Instructor role only
- **Form Fields**:
  - Title (required, max 200 chars)
  - Description (optional, max 500 chars, textarea)
  - Question Text (required, max 1000 chars, textarea)
  - Choices section (2-6 choices)
- **Choice Management**:
  - Display 2 choice inputs by default
  - Each choice has: text input + radio button for correct answer
  - "Add Choice" button (disabled after 6 choices)
  - "Remove Choice" button for each choice (disabled if only 2 remain)
  - Radio buttons ensure only one correct answer
- **Validation**:
  - All fields required except description
  - Minimum 2 choices, maximum 6 choices
  - At least one choice must be marked as correct
  - Each choice must have text
  - Show error messages inline
- **Actions**:
  - "Create Question" button (validates and submits)
  - "Cancel" button (returns to dashboard)
- **Components**: Use shadcn/ui Form, Input, Textarea, RadioGroup, Button

#### MCQ Preview Page (/dashboard/questions/:id/preview)
- **Access**: Instructor role only (own questions)
- **Display**:
  - Question title (large heading)
  - Question description (if present)
  - Question text
  - Choices as radio buttons
  - "Submit Answer" button
- **Interaction**:
  - User selects one choice
  - Clicks "Submit Answer"
  - System shows if answer is correct or incorrect
  - Correct answer: Green checkmark + success message
  - Incorrect answer: Red X + show correct answer highlighted in green
  - "Try Again" button to reset
  - "Back to Dashboard" button
- **Components**: Use shadcn/ui Card, RadioGroup, Button, Alert

#### MCQ Edit Page (/dashboard/questions/:id/edit)
- **Access**: Instructor role only (own questions)
- **Form Fields**: Same as creation page
- **Pre-filling**: Load existing question data on mount
- **Validation**: Same as creation page
- **Actions**:
  - "Update Question" button
  - "Cancel" button
- **Components**: Same as creation page

#### Student View (/dashboard)
- **Access**: Student role only
- **Display**: 
  - Centered card with "Coming Soon" message
  - Brief description: "MCQ practice will be available soon!"
  - Icon or illustration
- **Components**: Use shadcn/ui Card

---

## UI Development Guidelines

### Shadcn/UI Component Requirements

**CRITICAL**: All UI elements MUST use shadcn/ui components. Do NOT use plain HTML elements for interactive components.

#### Component Import Pattern
All shadcn/ui components should be imported from the `@/components/ui` alias:

```typescript
// ✅ CORRECT
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ❌ INCORRECT - Do not use plain HTML
// <button>Click me</button>
// <input type="text" />
// <table>...</table>
```

#### Required Components for Common UI Elements

| UI Element | Shadcn Component | Import Path |
|------------|------------------|-------------|
| Buttons | `Button` | `@/components/ui/button` |
| Text inputs | `Input` | `@/components/ui/input` |
| Text areas | `Textarea` | `@/components/ui/textarea` |
| Forms | `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` | `@/components/ui/form` |
| Tables | `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` | `@/components/ui/table` |
| Dropdowns | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` | `@/components/ui/dropdown-menu` |
| Radio buttons | `RadioGroup`, `RadioGroupItem` | `@/components/ui/radio-group` |
| Cards | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `@/components/ui/card` |
| Alerts | `Alert`, `AlertDescription`, `AlertTitle` | `@/components/ui/alert` |
| Dialogs | `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle`, `DialogTrigger` | `@/components/ui/dialog` |
| Toasts | `useToast`, `toast` | `@/components/ui/use-toast` |
| Badges | `Badge` | `@/components/ui/badge` |
| Pagination | `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationNext`, `PaginationPrevious` | `@/components/ui/pagination` |
| Skeleton | `Skeleton` | `@/components/ui/skeleton` |
| Labels | `Label` | `@/components/ui/label` |

#### Form Pattern with React Hook Form + Zod

All forms MUST use the shadcn/ui `Form` component integrated with `react-hook-form` and `zod`:

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Define validation schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(500).optional(),
});

export function QuestionForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Handle form submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter question title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

#### Styling Guidelines

- **Primary Method**: Use Tailwind CSS utility classes via the `className` prop
- **Customization**: Customize shadcn components using props and additional Tailwind classes
- **Consistency**: Maintain consistent spacing, colors, and typography across all pages
- **Do NOT**: Write custom CSS files or use inline styles unless absolutely necessary

```typescript
// ✅ CORRECT - Tailwind classes
<Button className="w-full mt-4" variant="default" size="lg">
  Create Question
</Button>

// ✅ CORRECT - Component variants
<Button variant="outline">Cancel</Button>
<Button variant="destructive">Delete</Button>

// ❌ INCORRECT - Inline styles
<button style={{ width: '100%', marginTop: '16px' }}>Create Question</button>
```

#### Common UI Patterns

**Loading States:**
```typescript
import { Skeleton } from "@/components/ui/skeleton";

{isLoading ? (
  <div className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
) : (
  <div>{content}</div>
)}
```

**Empty States:**
```typescript
import { Card, CardContent } from "@/components/ui/card";

{questions.length === 0 && (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
      <p className="text-muted-foreground">No questions yet</p>
      <Button className="mt-4" onClick={handleCreate}>Create your first question</Button>
    </CardContent>
  </Card>
)}
```

**Toast Notifications:**
```typescript
import { useToast } from "@/components/ui/use-toast";

const { toast } = useToast();

toast({
  title: "Success",
  description: "Question created successfully",
});

toast({
  title: "Error",
  description: "Failed to create question",
  variant: "destructive",
});
```

**Confirmation Dialogs:**
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Question?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete the question.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="destructive" onClick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Component Installation Check

Before starting UI development, verify these shadcn/ui components are installed:

**Core Components:**
- `button`
- `input`
- `textarea`
- `form`
- `label`

**Layout Components:**
- `card`
- `table`
- `pagination`

**Feedback Components:**
- `alert`
- `toast`
- `skeleton`
- `dialog`

**Input Components:**
- `radio-group`
- `dropdown-menu`
- `badge`

**Installation Command** (if any component is missing):
```bash
npx shadcn@latest add [component-name]
```

---

## Implementation Phases

**Phase Strategy**: Each phase is independently deployable and testable. Database → Backend → UI components are built incrementally to show progress and enable production deployment at each milestone.

---

### Phase 1: Database Foundation - ✅ COMPLETED

**Objective**: Set up database tables to support MCQ questions and choices with future extensibility.

**Why This Phase**: Database schema must exist before any backend or UI work can proceed.

**Tasks**:
1. Create migration file for `questions` table with all fields and indexes
2. Create migration file for `choices` table with all fields and indexes
3. Add composite indexes for query performance
4. Apply migrations to local database using Wrangler
5. Verify schema with manual SQL queries
6. Document data type conversions (SQLite → TypeScript)

**Deliverables**:
- ✅ `migrations/0002_create_questions_table.sql`
- ✅ `migrations/0003_create_choices_table.sql`
- ✅ Verified database schema in local D1
- ✅ Data type mapping documentation

**Testing**:
- Manual SQL INSERT/SELECT queries to verify schema
- Test foreign key constraints and cascading deletes
- Verify indexes are created properly

**Deployment Ready**: Yes - migrations can be applied to production database

---

### Phase 2: Backend Services Layer - ✅ COMPLETED

**Objective**: Implement reusable service layer for MCQ CRUD operations with proper data type handling.

**Why This Phase**: Services encapsulate business logic and database operations, making them reusable across API routes.

**Tasks**:
1. Create TypeScript interfaces for Question and Choice entities
2. Implement data type converters (DB ↔ TypeScript)
3. Create `lib/services/questions-service.ts` with:
   - `createQuestion()` - Insert question with choices in transaction
   - `getQuestionsByUserId()` - Get paginated list with sorting
   - `getQuestionById()` - Get single question with choices
   - `updateQuestion()` - Update question and choices
   - `deleteQuestion()` - Delete with cascading
4. Create `lib/validations/question-schema.ts` with Zod schemas
5. Write comprehensive unit tests for all service functions
6. Mock D1 database in tests

**Deliverables**:
- ✅ `lib/types/question.ts` - TypeScript interfaces
- ✅ `lib/services/questions-service.ts` - All CRUD operations
- ✅ `lib/validations/question-schema.ts` - Zod validation schemas
- ✅ `lib/services/__tests__/questions-service.test.ts` - Unit tests
- ✅ All tests passing (100% service coverage)

**Testing**:
- Unit tests for each service function
- Test data type conversions (boolean, dates)
- Test error scenarios (not found, validation errors)
- Test pagination and sorting logic

**Deployment Ready**: Yes - services can be deployed even without API routes

---

### Phase 3: API Routes with Versioning - ✅ COMPLETED

**Objective**: Create versioned REST API endpoints that expose backend services to frontend.

**Why This Phase**: API routes enable frontend to interact with backend services. Versioning allows future API changes without breaking clients.

**Tasks**:
1. Create `/api/v1/questions` route structure
2. Implement POST `/api/v1/questions` - Create question
3. Implement GET `/api/v1/questions` - List with pagination & sorting
4. Implement GET `/api/v1/questions/[id]` - Get single question
5. Implement PUT `/api/v1/questions/[id]` - Update question
6. Implement DELETE `/api/v1/questions/[id]` - Delete question
7. Implement POST `/api/v1/questions/[id]/validate` - Validate answer
8. Add authentication middleware (verify JWT token)
9. Add authorization checks (user owns question)
10. Test all endpoints with Postman/curl

**Deliverables**:
- ✅ `app/api/v1/questions/route.ts` - List (GET) & Create (POST)
- ✅ `app/api/v1/questions/[id]/route.ts` - Get (GET), Update (PUT), Delete (DELETE)
- ✅ `app/api/v1/questions/[id]/validate/route.ts` - Validate answer (POST)
- ✅ `lib/middleware/auth.ts` - Authentication helper (if needed)
- ✅ API documentation with examples

**Testing**:
- Manual API testing with Postman/curl
- Test authentication (valid token, invalid token, no token)
- Test authorization (own questions only)
- Test all error scenarios (400, 401, 404, 500)
- Test pagination parameters
- Test sorting parameters

**Deployment Ready**: Yes - API can be deployed and tested independently

---

### Phase 4: Questions Dashboard (List View) - ✅ COMPLETED

**Objective**: Build the main questions list page with table, sorting, and pagination.

**Why This Phase**: This is the entry point for instructors. Must work independently before create/edit/preview pages.

**Tasks**:
1. ✅ Create dashboard page at `/dashboard/questions`
2. ✅ Build questions table component using shadcn/ui Table
3. ✅ Implement client-side table with sortable columns
4. ✅ Implement pagination (10 items per page)
5. ✅ Add "Create Question" button (links to create page)
6. ✅ Create action dropdown menu (Preview, Edit, Delete)
7. ✅ Add loading state (skeleton loaders)
8. ✅ Add empty state ("No questions yet, create your first question")
9. ✅ Implement delete confirmation dialog (functional)
10. ✅ Add success/error toast notifications
11. ✅ Test responsive design (mobile, tablet, desktop)
12. ✅ Add role guard (instructors only)

**Deliverables**:
- ✅ `src/app/dashboard/questions/page.tsx` - Main dashboard page
- ✅ `components/questions/questions-table.tsx` - Table component
- ✅ `components/questions/delete-question-dialog.tsx` - Delete confirmation
- ✅ `src/app/layout.tsx` - Updated with Toaster component
- ✅ Installed shadcn/ui components: table, dropdown-menu, dialog, sonner, skeleton, textarea
- ✅ Working delete functionality
- ✅ Pagination and sorting working
- ✅ Responsive UI
- ✅ Zero TypeScript/ESLint errors
- ✅ Build successful (157 KB)

**Testing**:
- ✅ Build compiles successfully
- ✅ TypeScript types correct
- ✅ ESLint validation passed
- ✅ Loading skeleton displays
- ✅ Empty state displays when no questions
- ✅ Sorting by Title, Question, Created Date
- ✅ Pagination with page info
- ✅ Delete dialog with confirmation
- ✅ Toast notifications for actions
- ✅ Role-based access control

**Deployment Ready**: Yes - Dashboard is fully functional and can be deployed

---

### Phase 5: Question Creation Flow - ✅ COMPLETED

**Objective**: Build complete question creation page with dynamic choices and validation.

**Why This Phase**: After dashboard works, instructors need to create questions. This phase is complete and deployable.

**Tasks**:
1. Create question creation page at `/dashboard/questions/create`
2. Build reusable question form component
3. Implement title, description, and question text inputs
4. Implement dynamic choice management:
   - Show 2 choices by default
   - "Add Choice" button (max 6 choices)
   - "Remove Choice" button (min 2 choices)
   - Radio buttons for correct answer selection
5. Add form validation using react-hook-form + zod
6. Implement validation error display (inline errors)
7. Add "Create Question" button (submits to API)
8. Add "Cancel" button (returns to dashboard)
9. Show success toast and redirect to dashboard on success
10. Show error toast on failure
11. Test all validation scenarios

**Deliverables**:
- ✅ `src/app/dashboard/questions/create/page.tsx` - Creation page
- ✅ `components/questions/question-form.tsx` - Reusable form component
- ✅ `lib/validations/question-schema.ts` - Enhanced with form input type
- ✅ Complete create flow implemented
- ✅ All validation rules enforced
- ✅ Build successful (172 KB route)

**Testing**:
- Test form validation (all required fields)
- Test minimum 2 choices enforcement
- Test maximum 6 choices enforcement
- Test "Add Choice" button disabled at 6 choices
- Test "Remove Choice" disabled at 2 choices
- Test exactly one correct answer validation
- Test API integration (success and error cases)
- Test navigation after create

**Deployment Ready**: Yes - Creation flow is complete and independently functional

---

### Phase 6: Question Preview Flow - ✅ COMPLETED

**Objective**: Build question preview page where instructors can test their questions.

**Why This Phase**: After creation, instructors need to preview/test questions. This is independent from edit.

**Tasks**:
1. Create preview page at `/dashboard/questions/[id]/preview`
2. Fetch question with choices from API
3. Display question title, description, and question text
4. Render choices as radio button group
5. Add "Submit Answer" button
6. Call validate API endpoint on submit
7. Show correct answer feedback:
   - Correct: Green checkmark, success message
   - Incorrect: Red X, highlight correct answer in green
8. Add "Try Again" button (resets selection)
9. Add "Back to Dashboard" button
10. Add loading and error states
11. Ensure only question owner can preview

**Deliverables**:
- ✅ `src/app/dashboard/questions/[id]/preview/page.tsx` - Preview page with role guard
- ✅ `components/questions/question-preview.tsx` - Preview component
- ✅ Correct/incorrect feedback UI with visual indicators
- ✅ Working answer validation via API
- ✅ Authorization checks (role-based)
- ✅ Try again and navigation functionality

**Testing**:
- Test with correct answer selection
- Test with incorrect answer selection
- Test "Try Again" reset functionality
- Test authorization (only owner can preview)
- Test with questions having 2, 4, 6 choices
- Test loading and error states

**Deployment Ready**: Yes - Preview is fully functional and deployable

---

### Phase 7: Question Edit Flow - ✅ COMPLETED

**Objective**: Build question editing page to modify existing questions.

**Why This Phase**: After create and preview work, add edit capability. Reuses form from Phase 5.

**Tasks**:
1. Create edit page at `/dashboard/questions/[id]/edit`
2. Fetch existing question data from API
3. Reuse `question-form.tsx` component from Phase 5
4. Pre-fill form with existing values
5. Handle dynamic choices (load existing choices)
6. Add "Update Question" button (PUT to API)
7. Add "Cancel" button (returns to dashboard)
8. Show success toast and redirect on success
9. Show error toast on failure
10. Ensure only question owner can edit
11. Test all validation rules apply

**Deliverables**:
- ✅ `src/app/dashboard/questions/[id]/edit/page.tsx` - Edit page with role guard
- ✅ `components/questions/question-edit-form.tsx` - Edit form wrapper
- ✅ Reused `components/questions/question-form.tsx` component
- ✅ Complete edit flow working with PUT API
- ✅ Authorization checks (role-based + ownership)
- ✅ Pre-filling existing data with proper type conversion

**Testing**:
- Test loading existing question data
- Test form pre-filling
- Test updating all fields
- Test adding/removing choices during edit
- Test changing correct answer
- Test validation rules
- Test authorization (only owner can edit)
- Test API integration

**Deployment Ready**: Yes - Edit flow is complete and independently functional

---

### Phase 8: Role-Based Access & Student View - ✅ COMPLETED

**Objective**: Implement role-based access control and student "Coming Soon" page.

**Why This Phase**: Final polish to handle both user roles properly.

**Tasks**:
1. Create role guard component/HOC
2. Add role checks to all question routes:
   - `/dashboard/questions` - Instructors only
   - `/dashboard/questions/create` - Instructors only
   - `/dashboard/questions/[id]/edit` - Instructors only (+ owner)
   - `/dashboard/questions/[id]/preview` - Instructors only (+ owner)
3. Update main dashboard (`/dashboard`) to show:
   - Instructors: Redirect to `/dashboard/questions`
   - Students: Show "Coming Soon" message
4. Create "Coming Soon" component for students
5. Test both roles thoroughly
6. Add unauthorized access error handling (redirect with message)

**Deliverables**:
- ✅ `components/auth/role-guard.tsx` - Role guard component with loading and access denied UI
- ✅ `src/app/dashboard/page.tsx` - Main dashboard with role-based routing
- ✅ Student "Coming Soon" view integrated in dashboard
- ✅ Role guards applied to all protected pages (create, edit, preview)
- ✅ Server-side role validation in questions dashboard
- ✅ Client-side role guards with session checks
- ✅ Proper error handling, redirects, and user-friendly messaging

**Testing**:
- Test instructor access to all routes
- Test student sees "Coming Soon" on dashboard
- Test student cannot access question routes (redirect)
- Test instructor can only access own questions
- Test unauthorized access handling

**Deployment Ready**: Yes - Complete feature with role-based access

---

## Technical Implementation Details

### Key Files

**Database & Services**:
- `migrations/0002_create_questions_table.sql` - Questions table schema
- `migrations/0003_create_choices_table.sql` - Choices table schema
- `lib/types/question.ts` - TypeScript interfaces for Question and Choice
- `lib/services/questions-service.ts` - Question CRUD operations
- `lib/validations/question-schema.ts` - Zod validation schemas
- `lib/d1-client.ts` - Database client utilities (existing)

**API Routes** (Versioned):
- `app/api/v1/questions/route.ts` - List (GET) and create (POST) questions
- `app/api/v1/questions/[id]/route.ts` - Get (GET), update (PUT), delete (DELETE) specific question
- `app/api/v1/questions/[id]/validate/route.ts` - Validate answer (POST) for preview

**UI Components**:
- `app/dashboard/page.tsx` - Main dashboard (role-based routing)
- `app/dashboard/questions/page.tsx` - Questions list dashboard (instructors)
- `app/dashboard/questions/create/page.tsx` - Question creation page
- `app/dashboard/questions/[id]/edit/page.tsx` - Question edit page
- `app/dashboard/questions/[id]/preview/page.tsx` - Question preview/test page
- `components/questions/questions-table.tsx` - Questions list table
- `components/questions/question-row.tsx` - Table row component
- `components/questions/question-form.tsx` - Reusable form (create & edit)
- `components/questions/choice-input.tsx` - Single choice input field
- `components/questions/question-preview.tsx` - Preview display component
- `components/questions/delete-question-dialog.tsx` - Delete confirmation
- `components/dashboard/coming-soon.tsx` - Student "Coming Soon" view
- `components/auth/role-guard.tsx` - Role-based access control

**Validation & Types**:
- `lib/types/question.ts` - TypeScript interfaces and types
- `lib/validations/question-schema.ts` - Zod schemas for question validation

### Implementation Patterns

**Question Service Pattern**:
```typescript
// lib/services/questions-service.ts
export async function createQuestion(
  userId: string,
  data: CreateQuestionInput
) {
  const db = getDatabase();
  
  // Start transaction
  const questionId = generateId();
  
  // Insert question
  await executeMutation(
    db,
    `INSERT INTO questions (id, user_id, question_type, title, description, question_text)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    [questionId, userId, data.questionType, data.title, data.description, data.questionText]
  );
  
  // Insert choices
  for (const choice of data.choices) {
    await executeMutation(
      db,
      `INSERT INTO choices (id, question_id, choice_text, is_correct, display_order)
       VALUES (?1, ?2, ?3, ?4, ?5)`,
      [generateId(), questionId, choice.choiceText, choice.isCorrect ? 1 : 0, choice.displayOrder]
    );
  }
  
  return questionId;
}
```

**Form Validation Pattern**:
```typescript
// lib/validations/question-schema.ts
import { z } from 'zod';

export const choiceSchema = z.object({
  choiceText: z.string().min(1, 'Choice text is required').max(500),
  isCorrect: z.boolean(),
  displayOrder: z.number(),
});

export const questionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  questionText: z.string().min(1, 'Question is required').max(1000),
  questionType: z.enum(['mcq_single', 'mcq_multiple', 'true_false', 'fill_blank']),
  choices: z.array(choiceSchema)
    .min(2, 'At least 2 choices required')
    .max(6, 'Maximum 6 choices allowed')
    .refine(
      (choices) => choices.filter(c => c.isCorrect).length === 1,
      'Exactly one choice must be marked as correct'
    ),
});
```

**Dynamic Choice Management Pattern**:
```typescript
// components/questions/question-form.tsx
const [choices, setChoices] = useState([
  { choiceText: '', isCorrect: false, displayOrder: 1 },
  { choiceText: '', isCorrect: false, displayOrder: 2 },
]);

const addChoice = () => {
  if (choices.length < 6) {
    setChoices([
      ...choices,
      { choiceText: '', isCorrect: false, displayOrder: choices.length + 1 }
    ]);
  }
};

const removeChoice = (index: number) => {
  if (choices.length > 2) {
    setChoices(choices.filter((_, i) => i !== index));
  }
};
```

### Important Notes

- **SQLite Boolean Handling**: SQLite doesn't have a native boolean type. Use INTEGER (0/1) and convert in application layer.
- **Cascading Deletes**: Database schema uses `ON DELETE CASCADE` to automatically delete choices when a question is deleted.
- **Question Ownership**: All API endpoints must verify that the authenticated user owns the question they're trying to access.
- **Extensibility**: The `question_type` field allows for future question types without schema changes.
- **Pagination Performance**: Use indexes on `user_id` and `created_at` for efficient pagination queries.
- **Transaction Safety**: For operations that modify multiple tables (create/update question with choices), consider using D1 batch operations.

---

## Success Criteria

- [ ] Instructors can successfully create MCQ questions with 2-6 choices
- [ ] Only one choice can be marked as correct
- [ ] Questions table displays all user's questions with pagination (10 per page)
- [ ] Table supports sorting by title, description, question, and created date
- [ ] Preview page allows testing question and shows correct/incorrect feedback
- [ ] Edit page loads existing data and allows modifications
- [ ] Delete functionality removes question and all choices
- [ ] Students see "Coming soon" message instead of question dashboard
- [ ] Users can only access their own questions
- [ ] All validation rules are enforced (2-6 choices, one correct answer, required fields)
- [ ] UI is responsive and follows shadcn/ui design patterns
- [ ] Database schema supports future question type extensions
- [ ] All API endpoints have proper authentication and authorization

---

## Troubleshooting Guide

### Common Issue: "Cannot read property 'DB' of undefined"
**Problem**: Database binding not available in API route
**Cause**: Missing platform binding in Next.js context
**Solution**: Access database through proper env binding pattern
```typescript
// In API route
export async function POST(req: NextRequest) {
  const env = process.env as unknown as { DB: D1Database };
  const db = env.DB;
}
```

### Common Issue: "Binding errors in local development"
**Problem**: Parameters not binding correctly with `?` placeholders
**Cause**: Wrangler dev environment has quirks with parameter binding
**Solution**: Use positional placeholders `?1`, `?2` via helper functions in `lib/d1-client.ts`
**Code Reference**: `lib/d1-client.ts:executeQuery`

### Common Issue: "Form validation not working"
**Problem**: Form submits even when invalid
**Cause**: Missing form validation setup
**Solution**: Ensure react-hook-form is properly configured with zod resolver
```typescript
const form = useForm({
  resolver: zodResolver(questionSchema),
  defaultValues: { /* ... */ }
});
```

### Common Issue: "Choices not reordering after deletion"
**Problem**: Display order gets out of sync
**Cause**: Not updating display_order after removing choice
**Solution**: Recalculate display_order for all choices after any add/remove operation

---

## Future Enhancements

- MCQ with multiple correct answers support
- True/False question type
- Fill in the blanks question type
- Question tagging and categorization
- Question difficulty levels with adaptive selection
- Import questions from CSV/Excel
- Export questions to various formats
- Question templates and duplication
- Rich text editor for questions and choices (images, formatting)
- Question analytics (which questions students struggle with)
- Question banks and sharing between instructors
- Search and filter functionality in questions table
- Bulk operations (delete multiple, export selected)

---

## Dependencies

### External Dependencies
- Cloudflare D1 - Database for storing questions and choices
- JWT Authentication - User authentication (already implemented)
- Shadcn UI - Component library for UI elements

### Internal Dependencies
- User authentication service - For role-based access control
- D1 client utilities (`lib/d1-client.ts`) - Database operations
- User service - For fetching user role and information

### Environment Variables
- `DATABASE` - D1 database binding (configured in wrangler.jsonc)
- `JWT_SECRET` - For token verification (from existing auth implementation)

### NPM Packages
- `react-hook-form` - Form state management (already installed)
- `zod` - Schema validation (already installed)
- `@hookform/resolvers` - Integration between react-hook-form and zod (already installed)
- All required packages are already available in the project

---

## Risks and Mitigation

### Technical Risks

- **Risk**: Database schema changes may require complex migrations
- **Mitigation**: Design schema with extensibility in mind; use feature flags for new question types

- **Risk**: Concurrent updates to same question could cause data inconsistency
- **Mitigation**: Implement optimistic locking with `updated_at` timestamp checks

- **Risk**: Large number of questions may cause performance issues
- **Mitigation**: Use proper indexing, implement pagination, add caching layer if needed

- **Risk**: D1 batch operations may fail partially
- **Mitigation**: Wrap create/update operations in proper error handling; implement retry logic

### User Experience Risks

- **Risk**: Users may lose form data if they navigate away accidentally
- **Mitigation**: Implement "unsaved changes" warning; consider auto-save drafts

- **Risk**: Complex validation errors may confuse users
- **Mitigation**: Provide clear, specific error messages next to relevant fields

- **Risk**: Preview functionality may not accurately represent quiz-taking experience
- **Mitigation**: Use same component for preview and actual quiz (future feature)

---

## Current Status

**Last Updated**: January 8, 2026
**Current Phase**: Phase 4 Complete - Ready for Phase 5
**Status**: Backend + Dashboard Complete (Phases 1-4 ✅)

**Completed Phases:**
- ✅ Phase 1: Database Foundation (migrations, schema, indexes)
- ✅ Phase 2: Backend Services Layer (CRUD operations, validations, unit tests)
- ✅ Phase 3: API Routes with Versioning (6 REST endpoints, auth, authorization)
- ✅ Phase 4: MCQ Dashboard (paginated table, sorting, delete functionality)

**Production Deployment:**
- ✅ Local deployment verified and tested
- ✅ Production deployment successful
- ✅ API endpoints available at: `https://aisprints-starter.nithinjain.workers.dev/api/v1/questions`

**Phase 4 Achievements:**
- ✅ Questions dashboard at `/dashboard/questions`
- ✅ Paginated table (10 questions per page)
- ✅ Sortable columns (Title, Question, Created Date)
- ✅ Delete functionality with confirmation dialog
- ✅ Loading and empty states
- ✅ Toast notifications for user feedback
- ✅ Full shadcn/ui component integration
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Role-based access control (instructors only)
- ✅ Zero build errors, clean TypeScript

**Next Steps**: 
- 📋 Await user review of Phase 4 implementation
- 🔜 Phase 5: MCQ Creation Flow (question form with dynamic choices)

---

## Notes for Implementation

This PRD will be updated as implementation progresses. Key sections to maintain:
- Update phase status markers (⏳ → 🚧 → ✅) as work completes
- Add code examples and patterns to "Technical Implementation Details"
- Document any bugs found and fixed in "Troubleshooting Guide"
- Update "Current Status" after each phase completion
- Mark success criteria checkboxes as features are verified working


