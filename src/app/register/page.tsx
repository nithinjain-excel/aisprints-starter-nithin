import Link from 'next/link';
import { RegistrationForm } from '@/components/auth/registration-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* App Logo/Title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">QuizMaker</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Create and manage quizzes for your students
          </p>
        </div>

        {/* Registration Form Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create an account</CardTitle>
            <CardDescription>
              Get started with QuizMaker today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrationForm />
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}



