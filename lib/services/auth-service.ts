/**
 * Authentication Service
 * 
 * Core business logic for user authentication including:
 * - User registration
 * - User login (credential verification)
 * - User lookup
 * 
 * This service interacts with the database and uses utility functions
 * for password hashing and validation.
 */

import { getDatabase, executeQueryFirst, executeMutation } from '@/lib/d1-client';
import { hashPassword, verifyPassword } from '@/lib/utils/password';
import type { RegistrationData, LoginData } from '@/lib/validation/auth-schemas';

/**
 * User data structure returned from authentication operations.
 * Password hash is intentionally excluded for security.
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: 'instructor' | 'student';
  createdAt: string;
}

/**
 * Database user row structure (includes password_hash).
 * Used internally when querying the database.
 */
interface DatabaseUser {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string | null;
  role: 'instructor' | 'student';
  created_at: string;
  updated_at: string;
}

/**
 * Convert database user row to public User object.
 * Removes password_hash and converts snake_case to camelCase.
 */
function mapDatabaseUserToUser(dbUser: DatabaseUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    role: dbUser.role,
    createdAt: dbUser.created_at,
  };
}

/**
 * Register a new user in the system.
 * 
 * @param data - Registration data (validated by registrationSchema)
 * @returns Promise resolving to the newly created User object (without password)
 * @throws Error if email already exists or database operation fails
 * 
 * @example
 * const user = await registerUser({
 *   email: 'teacher@example.com',
 *   password: 'SecurePass123!',
 *   firstName: 'Jane',
 *   lastName: 'Doe',
 *   role: 'instructor'
 * });
 */
export async function registerUser(data: RegistrationData): Promise<User> {
  const db = getDatabase();
  
  // Hash the password before storing
  const passwordHash = await hashPassword(data.password);
  
  // Prepare SQL query
  const sql = `
    INSERT INTO users (email, password_hash, first_name, last_name, role)
    VALUES (?, ?, ?, ?, ?)
    RETURNING id, email, first_name, last_name, role, created_at, updated_at
  `;
  
  try {
    // Execute the insert query
    const result = await executeMutation<DatabaseUser>(
      db,
      sql,
      [
        data.email.toLowerCase(), // Normalize email to lowercase
        passwordHash,
        data.firstName,
        data.lastName || null,
        data.role,
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create user');
    }
    
    // Convert database format to public User format
    return mapDatabaseUserToUser(result);
  } catch (error: any) {
    // Check if error is due to unique constraint violation (duplicate email)
    if (error.message?.includes('UNIQUE constraint failed')) {
      throw new Error('Email already registered');
    }
    
    console.error('Error registering user:', error);
    throw new Error('Failed to register user');
  }
}

/**
 * Authenticate a user with email and password.
 * 
 * @param data - Login credentials (validated by loginSchema)
 * @returns Promise resolving to User object if credentials are valid, null if invalid
 * 
 * @example
 * const user = await loginUser({
 *   email: 'teacher@example.com',
 *   password: 'SecurePass123!'
 * });
 * 
 * if (user) {
 *   console.log('Login successful!', user.firstName);
 * } else {
 *   console.log('Invalid credentials');
 * }
 */
export async function loginUser(data: LoginData): Promise<User | null> {
  const db = getDatabase();
  
  // Query for user by email
  const sql = `
    SELECT id, email, password_hash, first_name, last_name, role, created_at, updated_at
    FROM users
    WHERE email = ?
    LIMIT 1
  `;
  
  try {
    const dbUser = await executeQueryFirst<DatabaseUser>(
      db,
      sql,
      [data.email.toLowerCase()]
    );
    
    if (!dbUser) {
      // User not found
      return null;
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(data.password, dbUser.password_hash);
    
    if (!isPasswordValid) {
      // Password is incorrect
      return null;
    }
    
    // Password is correct, return user data (without password hash)
    return mapDatabaseUserToUser(dbUser);
  } catch (error) {
    console.error('Error during login:', error);
    return null;
  }
}

/**
 * Get user by ID.
 * 
 * @param userId - The unique identifier for the user
 * @returns Promise resolving to User object if found, null if not found
 * 
 * @example
 * const user = await getUserById('abc123');
 * if (user) {
 *   console.log('Found user:', user.email);
 * }
 */
export async function getUserById(userId: string): Promise<User | null> {
  const db = getDatabase();
  
  const sql = `
    SELECT id, email, password_hash, first_name, last_name, role, created_at, updated_at
    FROM users
    WHERE id = ?
    LIMIT 1
  `;
  
  try {
    const dbUser = await executeQueryFirst<DatabaseUser>(db, sql, [userId]);
    
    if (!dbUser) {
      return null;
    }
    
    return mapDatabaseUserToUser(dbUser);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Check if an email is already registered.
 * 
 * @param email - The email address to check
 * @returns Promise resolving to true if email exists, false otherwise
 * 
 * @example
 * const exists = await emailExists('teacher@example.com');
 * if (exists) {
 *   console.log('Email already registered');
 * }
 */
export async function emailExists(email: string): Promise<boolean> {
  const db = getDatabase();
  
  const sql = `
    SELECT COUNT(*) as count
    FROM users
    WHERE email = ?
  `;
  
  try {
    const result = await executeQueryFirst<{ count: number }>(
      db,
      sql,
      [email.toLowerCase()]
    );
    
    return (result?.count ?? 0) > 0;
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
}

