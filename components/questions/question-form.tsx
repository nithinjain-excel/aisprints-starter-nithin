'use client';

/**
 * Reusable Question Form Component
 * 
 * Used for both creating and editing questions.
 * Features:
 * - Dynamic choice management (2-6 choices)
 * - Form validation with react-hook-form + zod
 * - Radio button selection for correct answer
 * - Add/Remove choice buttons
 * - Success/error feedback
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createQuestionSchema, type CreateQuestionFormInput } from '@/lib/validations/question-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface QuestionFormProps {
  mode: 'create' | 'edit';
  questionId?: string;
  defaultValues?: Partial<CreateQuestionFormInput>;
}

export function QuestionForm({ mode, questionId, defaultValues }: QuestionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateQuestionFormInput>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: defaultValues || {
      title: '',
      description: '',
      questionText: '',
      questionType: 'mcq_single',
      points: 1,
      difficulty: 'medium',
      choices: [
        { choiceText: '', isCorrect: true, displayOrder: 1 },
        { choiceText: '', isCorrect: false, displayOrder: 2 },
      ],
    },
  });

  const choices = watch('choices') || [];

  const handleAddChoice = () => {
    if (choices.length < 6) {
      const newChoice = {
        choiceText: '',
        isCorrect: false,
        displayOrder: choices.length + 1,
      };
      setValue('choices', [...choices, newChoice]);
    }
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length > 2) {
      const newChoices = choices.filter((_, i) => i !== index);
      // Re-number display order
      newChoices.forEach((choice, i) => {
        choice.displayOrder = i + 1;
      });
      // If we removed the correct answer, make the first choice correct
      if (index === correctAnswerIndex) {
        newChoices[0].isCorrect = true;
        setCorrectAnswerIndex(0);
      } else if (index < correctAnswerIndex) {
        setCorrectAnswerIndex(correctAnswerIndex - 1);
      }
      setValue('choices', newChoices);
    }
  };

  const handleCorrectAnswerChange = (index: number) => {
    const updatedChoices = choices.map((choice, i) => ({
      ...choice,
      isCorrect: i === index,
    }));
    setValue('choices', updatedChoices);
    setCorrectAnswerIndex(index);
  };

  const onSubmit = async (data: CreateQuestionFormInput) => {
    setIsSubmitting(true);
    try {
      const url = mode === 'create' 
        ? '/api/v1/questions' 
        : `/api/v1/questions/${questionId}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to save question');
      }

      toast.success(
        mode === 'create' 
          ? 'Question created successfully!' 
          : 'Question updated successfully!'
      );
      router.push('/dashboard/questions');
      router.refresh();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to save question. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Enter question title"
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter additional context or instructions"
          rows={3}
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <Label htmlFor="questionText">
          Question <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="questionText"
          {...register('questionText')}
          placeholder="Enter your question"
          rows={4}
          disabled={isSubmitting}
        />
        {errors.questionText && (
          <p className="text-sm text-destructive">{errors.questionText.message}</p>
        )}
      </div>

      {/* Choices */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>
            Answer Choices <span className="text-destructive">*</span>
            <span className="text-sm text-muted-foreground ml-2">
              ({choices.length}/6 choices)
            </span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddChoice}
            disabled={choices.length >= 6 || isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Choice
          </Button>
        </div>

        <RadioGroup
          value={correctAnswerIndex.toString()}
          onValueChange={(value) => handleCorrectAnswerChange(parseInt(value))}
        >
          <div className="space-y-3">
            {choices.map((choice, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <RadioGroupItem
                  value={index.toString()}
                  id={`choice-${index}`}
                  className="mt-3"
                  disabled={isSubmitting}
                />
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`choices.${index}.choiceText`}>
                    Choice {index + 1}
                  </Label>
                  <Input
                    {...register(`choices.${index}.choiceText` as const)}
                    placeholder={`Enter choice ${index + 1}`}
                    disabled={isSubmitting}
                  />
                  {errors.choices?.[index]?.choiceText && (
                    <p className="text-sm text-destructive">
                      {errors.choices[index]?.choiceText?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveChoice(index)}
                  disabled={choices.length <= 2 || isSubmitting}
                  className="mt-7"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </RadioGroup>

        {errors.choices && typeof errors.choices.message === 'string' && (
          <p className="text-sm text-destructive">{errors.choices.message}</p>
        )}

        <p className="text-sm text-muted-foreground">
          Select the radio button next to the correct answer
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : mode === 'create' ? (
            'Create Question'
          ) : (
            'Update Question'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/questions')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

