import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
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

        {/* Login Form Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Login to your QuizMaker account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        {/* Register Link */}
        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}



