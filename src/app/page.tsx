import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/utils/session';
import { getUserById } from '@/lib/services/auth-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogoutButton } from '@/components/auth/logout-button';

export default async function Home() {
  // Middleware handles authentication - if we reach here, user is authenticated
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  
  // This should always exist due to middleware, but we check for type safety
  if (!sessionToken) {
    redirect('/login');
  }

  const session = await verifySession(sessionToken);
  if (!session) {
    redirect('/login');
  }

  // Get user data
  const user = await getUserById(session.userId);
  if (!user) {
    redirect('/login');
  }

  const fullName = user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.firstName;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header with Logout */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">QuizMaker</h1>
          <LogoutButton />
        </div>

        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back, {fullName}!</CardTitle>
            <CardDescription>
              Logged in as{' '}
              <Badge variant="secondary" className="ml-1">
                {user.role === 'instructor' ? 'Instructor' : 'Student'}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Card for Future Features */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to QuizMaker!</CardTitle>
            <CardDescription>
              Your quiz management platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Coming soon:</p>
              <ul className="space-y-2 pl-5 list-disc">
                {user.role === 'instructor' ? (
                  <>
                    <li>Create and manage multiple-choice quizzes</li>
                    <li>Build question banks for your courses</li>
                    <li>Assign quizzes to students</li>
                    <li>View student results and analytics</li>
                  </>
                ) : (
                  <>
                    <li>Take quizzes assigned by your instructors</li>
                    <li>View your quiz results and feedback</li>
                    <li>Track your progress over time</li>
                    <li>Access quiz history and scores</li>
                  </>
                )}
              </ul>
              <p className="pt-3 text-xs italic">
                MCQ authoring and quiz-taking features will be available in the next phase.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
