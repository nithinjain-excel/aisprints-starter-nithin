/**
 * Authentication Validation Schemas
 * 
 * Zod schemas for validating authentication-related data.
 * These schemas are used for both frontend form validation and backend API validation.
 */

import { z } from 'zod';

/**
 * Password validation schema with complexity requirements.
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/,
    'Password must contain at least one special character'
  );

/**
 * User registration schema.
 * 
 * Validates all data required to register a new user.
 */
export const registrationSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  
  lastName: z
    .string()
    .max(50, 'Last name must be less than 50 characters')
    .trim()
    .optional()
    .or(z.literal('')), // Allow empty string for optional field
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase() // Normalize email to lowercase
    .trim(),
  
  password: passwordSchema,
  
  role: z.enum(['instructor', 'student'], {
    message: 'Please select a role',
  }),
});

/**
 * User login schema.
 * 
 * Validates credentials for user login.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(1, 'Password is required'), // Just check it's not empty for login
});

/**
 * Type inference for registration data.
 * Use this type for type-safe form handling and API requests.
 */
export type RegistrationData = z.infer<typeof registrationSchema>;

/**
 * Type inference for login data.
 * Use this type for type-safe form handling and API requests.
 */
export type LoginData = z.infer<typeof loginSchema>;

/**
 * Validate password strength and return detailed feedback.
 * 
 * @param password - The password to check
 * @returns Object with validation results for each requirement
 * 
 * @example
 * const strength = validatePasswordStrength('MyPass123!');
 * console.log(strength.hasMinLength); // true
 * console.log(strength.hasUppercase); // true
 * console.log(strength.isValid); // true
 */
export function validatePasswordStrength(password: string) {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    isValid: passwordSchema.safeParse(password).success,
  };
}

