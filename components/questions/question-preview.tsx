'use client';

/**
 * Question Preview Component
 * 
 * Displays a question and allows testing with answer validation.
 * Features:
 * - Fetch and display question with choices
 * - Radio button selection for answer
 * - Submit answer for validation
 * - Visual feedback (correct/incorrect)
 * - Try again and navigation buttons
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import type { QuestionWithChoices, Choice } from '@/lib/types/question';

interface QuestionPreviewProps {
  questionId: string;
}

interface ValidationResult {
  isCorrect: boolean;
  correctChoiceId: string;
  selectedChoiceId: string;
}

export function QuestionPreview({ questionId }: QuestionPreviewProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [question, setQuestion] = useState<QuestionWithChoices | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
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
          throw new Error('You do not have permission to view this question');
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

  const handleSubmitAnswer = async () => {
    if (!selectedChoiceId) {
      toast.error('Please select an answer');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/questions/${questionId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ choiceId: selectedChoiceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate answer');
      }

      const result = await response.json() as ValidationResult;
      setValidationResult(result);

      if (result.isCorrect) {
        toast.success('Correct answer! 🎉');
      } else {
        toast.error('Incorrect answer. Try again!');
      }
    } catch (err) {
      console.error('Error validating answer:', err);
      toast.error('Failed to validate answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setSelectedChoiceId('');
    setValidationResult(null);
  };

  const getChoiceClassName = (choice: Choice) => {
    if (!validationResult) return '';

    if (choice.id === validationResult.correctChoiceId) {
      return 'border-green-500 bg-green-50 dark:bg-green-950';
    }

    if (choice.id === validationResult.selectedChoiceId && !validationResult.isCorrect) {
      return 'border-red-500 bg-red-50 dark:bg-red-950';
    }

    return '';
  };

  const getChoiceIcon = (choice: Choice) => {
    if (!validationResult) return null;

    if (choice.id === validationResult.correctChoiceId) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }

    if (choice.id === validationResult.selectedChoiceId && !validationResult.isCorrect) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }

    return null;
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

  const sortedChoices = [...question.choices].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/questions')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle>{question.title}</CardTitle>
          {question.description && (
            <CardDescription className="text-base">{question.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Text */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-lg font-medium">{question.questionText}</p>
          </div>

          {/* Answer Choices */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Select your answer:</Label>
            <RadioGroup
              value={selectedChoiceId}
              onValueChange={setSelectedChoiceId}
              disabled={validationResult !== null || isSubmitting}
            >
              <div className="space-y-3">
                {sortedChoices.map((choice) => (
                  <div
                    key={choice.id}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${getChoiceClassName(
                      choice
                    )}`}
                  >
                    <RadioGroupItem
                      value={choice.id}
                      id={choice.id}
                      disabled={validationResult !== null || isSubmitting}
                    />
                    <Label
                      htmlFor={choice.id}
                      className="flex-1 cursor-pointer text-base"
                    >
                      {choice.choiceText}
                    </Label>
                    {getChoiceIcon(choice)}
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Validation Feedback */}
          {validationResult && (
            <div
              className={`p-4 rounded-lg border-2 ${
                validationResult.isCorrect
                  ? 'bg-green-50 border-green-500 dark:bg-green-950'
                  : 'bg-red-50 border-red-500 dark:bg-red-950'
              }`}
            >
              <div className="flex items-center gap-2">
                {validationResult.isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Correct! Well done! 🎉
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <p className="font-semibold text-red-900 dark:text-red-100">
                      Incorrect. The correct answer is highlighted in green.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            {!validationResult ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={!selectedChoiceId || isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Submit Answer'
                )}
              </Button>
            ) : (
              <Button onClick={handleTryAgain} variant="outline">
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

