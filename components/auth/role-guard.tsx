'use client';

/**
 * Role Guard Component
 * 
 * Protects routes based on user role.
 * Redirects unauthorized users or shows access denied message.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('instructor' | 'student')[];
  redirectTo?: string;
  showMessage?: boolean;
}

interface SessionResponse {
  success: boolean;
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'instructor' | 'student';
  };
}

export function RoleGuard({
  children,
  allowedRoles,
  redirectTo = '/dashboard',
  showMessage = true,
}: RoleGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAuthorization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthorization = async () => {
    try {
      const response = await fetch('/api/auth/session');

      if (!response.ok) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      const data = await response.json() as SessionResponse;
      
      // Check if session is authenticated
      if (!data.authenticated || !data.user) {
        router.push('/login');
        return;
      }

      setUserRole(data.user.role);

      if (allowedRoles.includes(data.user.role)) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        if (!showMessage) {
          router.push(redirectTo);
        }
      }
    } catch (error) {
      console.error('Error checking authorization:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthorized) {
    if (!showMessage) {
      return null;
    }

    return (
      <div className="container mx-auto py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-destructive" />
              <div>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  You do not have permission to access this page.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This page is only accessible to instructors. Your current role is: <strong>{userRole}</strong>.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

