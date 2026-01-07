/**
 * Dashboard Layout Component
 * 
 * Provides a consistent layout for all authenticated pages with:
 * - Header with QuizMaker branding
 * - User info and logout button
 * - Responsive design matching login page theme
 */

import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    firstName: string;
    lastName?: string | null;
    role: 'instructor' | 'student';
  };
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function DashboardLayout({ children, user, maxWidth = 'full' }: DashboardLayoutProps) {
  const fullName = user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.firstName;

  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold md:text-2xl">QuizMaker</h1>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
              <span>{fullName}</span>
              <Badge variant="secondary" className="text-xs">
                {user.role === 'instructor' ? 'Instructor' : 'Student'}
              </Badge>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-6 md:py-8">
        <div className={`container mx-auto px-4 md:px-6 ${maxWidthClasses[maxWidth]}`}>
          {children}
        </div>
      </main>
    </div>
  );
}

