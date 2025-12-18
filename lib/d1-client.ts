/**
 * D1 Database Client Utilities
 * 
 * Provides safe helpers for interacting with Cloudflare D1 database.
 * 
 * Key features:
 * - Parameter binding normalization (? → ?1, ?2, ...)
 * - Type-safe query execution
 * - Error handling
 * - Supports Cloudflare Workers environment
 */

/**
 * Database binding interface for Cloudflare D1.
 * This matches the D1Database type from @cloudflare/workers-types.
 */
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: {
    duration: number;
    size_after?: number;
    rows_read?: number;
    rows_written?: number;
  };
  error?: string;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

/**
 * Normalize SQL query placeholders from ? to ?1, ?2, ?3, etc.
 * This helps avoid D1 binding errors in local development.
 * 
 * @param sql - SQL query with ? placeholders
 * @returns SQL query with numbered placeholders
 */
function normalizePlaceholders(sql: string): string {
  let count = 0;
  return sql.replace(/\?/g, () => `?${++count}`);
}

/**
 * Get the D1 database instance from the environment.
 * In Cloudflare Workers, this is provided via env.DB binding.
 * 
 * @returns D1Database instance
 * @throws Error if database binding is not available
 */
export function getDatabase(): D1Database {
  // In Next.js/Cloudflare environment, the database is available via process.env
  // @ts-ignore - This will be available at runtime in Cloudflare Workers
  const db = process.env.DB || global.__D1_DB__;
  
  if (!db) {
    throw new Error('D1 database binding not found. Ensure DB is configured in wrangler.jsonc');
  }
  
  return db as D1Database;
}

/**
 * Execute a SELECT query and return all results.
 * 
 * @param db - D1 database instance
 * @param sql - SQL query with ? placeholders
 * @param params - Parameters to bind to the query
 * @returns Promise resolving to array of results
 * 
 * @example
 * const users = await executeQuery<User>(db, 'SELECT * FROM users WHERE role = ?', ['instructor']);
 */
export async function executeQuery<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const normalizedSql = normalizePlaceholders(sql);
  const stmt = db.prepare(normalizedSql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  const result = await bound.all<T>();
  
  if (!result.success) {
    throw new Error(`Database query failed: ${result.error || 'Unknown error'}`);
  }
  
  return result.results || [];
}

/**
 * Execute a SELECT query and return the first result.
 * 
 * @param db - D1 database instance
 * @param sql - SQL query with ? placeholders
 * @param params - Parameters to bind to the query
 * @returns Promise resolving to first result or null
 * 
 * @example
 * const user = await executeQueryFirst<User>(db, 'SELECT * FROM users WHERE email = ?', ['user@example.com']);
 */
export async function executeQueryFirst<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const results = await executeQuery<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE query.
 * For INSERT with RETURNING, returns the inserted row.
 * 
 * @param db - D1 database instance
 * @param sql - SQL query with ? placeholders
 * @param params - Parameters to bind to the query
 * @returns Promise resolving to the returned row (for RETURNING queries) or null
 * 
 * @example
 * const newUser = await executeMutation<User>(
 *   db,
 *   'INSERT INTO users (email, name) VALUES (?, ?) RETURNING *',
 *   ['user@example.com', 'John']
 * );
 */
export async function executeMutation<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const normalizedSql = normalizePlaceholders(sql);
  const stmt = db.prepare(normalizedSql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  
  // Use all() instead of run() to get RETURNING results
  const result = await bound.all<T>();
  
  if (!result.success) {
    throw new Error(`Database mutation failed: ${result.error || 'Unknown error'}`);
  }
  
  // Return the first result (for RETURNING queries) or null
  return (result.results && result.results.length > 0) ? result.results[0] : null;
}

/**
 * Execute multiple queries in a batch transaction.
 * All queries must succeed or all will be rolled back.
 * 
 * @param db - D1 database instance
 * @param queries - Array of {sql, params} objects
 * @returns Promise resolving to array of results
 * 
 * @example
 * await executeBatch(db, [
 *   { sql: 'INSERT INTO users (email) VALUES (?)', params: ['user1@example.com'] },
 *   { sql: 'INSERT INTO users (email) VALUES (?)', params: ['user2@example.com'] }
 * ]);
 */
export async function executeBatch(
  db: D1Database,
  queries: Array<{ sql: string; params?: unknown[] }>
): Promise<D1Result[]> {
  const statements = queries.map(({ sql, params = [] }) => {
    const normalizedSql = normalizePlaceholders(sql);
    const stmt = db.prepare(normalizedSql);
    return params.length > 0 ? stmt.bind(...params) : stmt;
  });
  
  const results = await db.batch(statements);
  
  // Check if any query failed
  const failed = results.find(r => !r.success);
  if (failed) {
    throw new Error(`Batch execution failed: ${failed.error || 'Unknown error'}`);
  }
  
  return results;
}

/**
 * Generate a unique ID for database records.
 * Creates a 16-byte random hex string (32 characters).
 * 
 * @returns Lowercase hex string (32 characters)
 * 
 * @example
 * const id = generateId(); // e.g., "2d3aa4f9d19bd0fba327928f14089c92"
 */
export function generateId(): string {
  // Generate 16 random bytes and convert to hex
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

