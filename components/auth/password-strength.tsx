'use client';

import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'One lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: 'One number',
    test: (password) => /[0-9]/.test(password),
  },
  {
    label: 'One special character',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
  },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        Password must contain:
      </p>
      <ul className="space-y-1.5">
        {requirements.map((requirement, index) => {
          const isMet = requirement.test(password);
          return (
            <li
              key={index}
              className="flex items-center gap-2 text-sm"
            >
              {isMet ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span
                className={
                  isMet
                    ? 'text-green-600 dark:text-green-500'
                    : 'text-muted-foreground'
                }
              >
                {requirement.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}








