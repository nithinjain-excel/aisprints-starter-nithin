/**
 * Mock D1 Database for Local Development
 * 
 * This provides a simple in-memory database for testing without Cloudflare Workers.
 * In production, the real D1 binding will be used.
 */

import type { D1Database, D1PreparedStatement, D1Result } from './d1-client';

interface MockRow {
  [key: string]: unknown;
}

class MockPreparedStatement implements D1PreparedStatement {
  private query: string;
  private params: unknown[] = [];
  private mockData: Map<string, MockRow[]>;

  constructor(query: string, mockData: Map<string, MockRow[]>) {
    this.query = query;
    this.mockData = mockData;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    this.params = values;
    return this;
  }

  async first<T = unknown>(): Promise<T | null> {
    const result = await this.all<T>();
    return result.results?.[0] ?? null;
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    return this.all<T>();
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    // Simple mock: return mock data for queries
    console.warn('⚠️  Using MOCK D1 Database - data will not persist!');
    console.log('Query:', this.query);
    console.log('Params:', this.params);

    const queryUpper = this.query.trim().toUpperCase();

    // For INSERT...RETURNING (user registration)
    if (queryUpper.includes('INSERT INTO USERS') && queryUpper.includes('RETURNING')) {
      const mockUser = {
        id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: this.params[0] as string,
        first_name: this.params[2] as string,
        last_name: this.params[3] as string,
        role: this.params[4] as string,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log('✓ Mock user created:', { id: mockUser.id, email: mockUser.email });
      return {
        success: true,
        results: [mockUser] as T[],
        meta: {
          duration: 1,
          rows_read: 0,
          rows_written: 1,
        },
      };
    }

    // For SELECT queries (user lookup)
    if (queryUpper.startsWith('SELECT')) {
      console.log('ℹ️  SELECT query - returning empty (user not found)');
      return {
        success: true,
        results: [] as T[],
        meta: {
          duration: 1,
          rows_read: 0,
          rows_written: 0,
        },
      };
    }

    // For other INSERT/UPDATE/DELETE queries
    return {
      success: true,
      results: [] as T[],
      meta: {
        duration: 1,
        rows_read: 0,
        rows_written: 1,
      },
    };
  }

  async raw<T = unknown>(): Promise<T[]> {
    const result = await this.all<T>();
    return result.results ?? [];
  }
}

class MockD1Database implements D1Database {
  private mockData: Map<string, MockRow[]> = new Map();

  prepare(query: string): D1PreparedStatement {
    return new MockPreparedStatement(query, this.mockData);
  }

  async dump(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    return Promise.all(statements.map(stmt => stmt.run<T>()));
  }

  async exec(query: string): Promise<{ count: number; duration: number }> {
    console.warn('⚠️  Using MOCK D1 Database - data will not persist!');
    console.log('Exec query:', query);
    return { count: 0, duration: 0 };
  }
}

let mockInstance: D1Database | null = null;

/**
 * Get or create a mock D1 database instance for local development.
 */
export function getMockDatabase(): D1Database {
  if (!mockInstance) {
    console.warn('╔═══════════════════════════════════════════════════╗');
    console.warn('║  🚧 USING MOCK D1 DATABASE FOR LOCAL DEVELOPMENT  ║');
    console.warn('║  ⚠️  Data will NOT persist between requests!      ║');
    console.warn('║  📝 Use `npm run preview` for real D1 database    ║');
    console.warn('╚═══════════════════════════════════════════════════╝');
    mockInstance = new MockD1Database();
  }
  return mockInstance;
}

