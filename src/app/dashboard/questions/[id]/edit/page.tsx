/**
 * Question Edit Page
 * 
 * Allows instructors to edit existing questions.
 * Features:
 * - Fetch and pre-fill existing question data
 * - Reuse QuestionForm component
 * - Update question via PUT API
 * - Authorization (only owner can edit)
 * - Role-based access control (instructors only)
 */

'use client';

import { use } from 'react';
import { QuestionEditForm } from '@/components/questions/question-edit-form';
import { DashboardLayoutClient } from '@/components/layout/dashboard-layout-client';

interface EditQuestionPageProps {
  params: Promise<{ id: string }>;
}

export default function EditQuestionPage({ params }: EditQuestionPageProps) {
  const { id } = use(params);

  return (
    <DashboardLayoutClient maxWidth="2xl" requireInstructor>
      <QuestionEditForm questionId={id} />
    </DashboardLayoutClient>
  );
}

