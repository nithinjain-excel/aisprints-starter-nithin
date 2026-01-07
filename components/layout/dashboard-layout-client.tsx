'use client';

/**
 * Client-side Dashboard Layout Wrapper
 * 
 * Fetches user session and wraps content with DashboardLayout.
 * Used for client components that need the layout.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from './dashboard-layout';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName?: string | null;
  role: 'instructor' | 'student';
}

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  requireInstructor?: boolean;
}

export function DashboardLayoutClient({ 
  children, 
  maxWidth = 'full',
  requireInstructor = false 
}: DashboardLayoutClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/session');

      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json() as { authenticated: boolean; user: User };
      
      if (!data.authenticated || !data.user) {
        router.push('/login');
        return;
      }

      // Check instructor requirement
      if (requireInstructor && data.user.role !== 'instructor') {
        router.push('/dashboard');
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user} maxWidth={maxWidth}>
      {children}
    </DashboardLayout>
  );
}

