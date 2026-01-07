/**
 * Question Preview Page
 * 
 * Allows instructors to preview and test their questions.
 * Features:
 * - Display question with all choices
 * - Submit answer for validation
 * - Show correct/incorrect feedback
 * - Try again functionality
 * - Authorization (only owner can preview)
 * - Role-based access control (instructors only)
 */

'use client';

import { use } from 'react';
import { QuestionPreview } from '@/components/questions/question-preview';
import { DashboardLayoutClient } from '@/components/layout/dashboard-layout-client';

interface PreviewQuestionPageProps {
  params: Promise<{ id: string }>;
}

export default function PreviewQuestionPage({ params }: PreviewQuestionPageProps) {
  const { id } = use(params);

  return (
    <DashboardLayoutClient maxWidth="2xl" requireInstructor>
      <QuestionPreview questionId={id} />
    </DashboardLayoutClient>
  );
}

