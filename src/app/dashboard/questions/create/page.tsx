/**
 * Question Creation Page
 * 
 * Allows instructors to create new MCQ questions with dynamic choices.
 * Features:
 * - Dynamic choice management (2-6 choices)
 * - Form validation with react-hook-form + zod
 * - Success/error feedback with toasts
 * - Navigation back to dashboard
 * - Role-based access control (instructors only)
 */

import { getSessionToken } from "@/lib/utils/cookies";
import { verifySession } from "@/lib/utils/session";
import { getUserById } from "@/lib/services/auth-service";
import { redirect } from "next/navigation";
import { QuestionForm } from '@/components/questions/question-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default async function CreateQuestionPage() {
  // Get session token
  const token = await getSessionToken();
  
  if (!token) {
    redirect("/login");
  }
  
  // Verify session
  const session = await verifySession(token);
  
  if (!session) {
    redirect("/login");
  }
  
  // Check if user is an instructor
  if (session.role !== "instructor") {
    redirect("/dashboard");
  }

  // Get user data for display
  const user = await getUserById(session.userId);
  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout user={user} maxWidth="2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Question</CardTitle>
          <CardDescription>
            Create a multiple choice question with 2-6 answer choices. Select one correct answer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionForm mode="create" />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

