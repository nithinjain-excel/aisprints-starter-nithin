'use client';

/**
 * Question Edit Form Wrapper
 * 
 * Fetches existing question data and passes it to the reusable QuestionForm.
 * Handles loading and error states.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionForm } from './question-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { QuestionWithChoices } from '@/lib/types/question';
import type { CreateQuestionFormInput } from '@/lib/validations/question-schema';

interface QuestionEditFormProps {
  questionId: string;
}

export function QuestionEditForm({ questionId }: QuestionEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState<QuestionWithChoices | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/questions/${questionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Question not found');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to edit this question');
        }
        throw new Error('Failed to load question');
      }

      const data = await response.json() as QuestionWithChoices;
      setQuestion(data);
    } catch (err) {
      console.error('Error fetching question:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load question';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Question...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !question) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error || 'Failed to load question'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/dashboard/questions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Transform question data to form format
  const defaultValues: Partial<CreateQuestionFormInput> = {
    title: question.title,
    description: question.description || '',
    questionText: question.questionText,
    questionType: question.questionType,
    points: question.points,
    difficulty: question.difficulty,
    choices: question.choices
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((choice) => ({
        choiceText: choice.choiceText,
        isCorrect: choice.isCorrect,
        displayOrder: choice.displayOrder,
      })),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Question</CardTitle>
        <CardDescription>
          Update your multiple choice question. Changes will be saved immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QuestionForm
          mode="edit"
          questionId={questionId}
          defaultValues={defaultValues}
        />
      </CardContent>
    </Card>
  );
}

