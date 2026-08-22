export interface error_types {
  invalidCredentials: string;
  userExists: string;
  invalidToken: string;
  serverError: string;
  notFound: string;
}

// Prisma error interface for database operations
export interface PrismaError {
  message?: string;
  code?: string;
  meta?: {
    target?: string[];
    field_name?: string;
    column_name?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
