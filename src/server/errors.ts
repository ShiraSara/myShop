/**
 * Domain errors thrown by services. Server actions / route handlers translate them
 * into safe user-facing messages — stack traces never reach the client.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "RATE_LIMITED" | "CONFLICT" | "STORAGE_NOT_CONFIGURED" | "STORAGE_FAILED",
    public readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "יש להתחבר כדי להמשיך") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "אין לך הרשאה לבצע פעולה זו") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "הפריט לא נמצא") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION", 400);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "יותר מדי ניסיונות. נסו שוב בעוד מספר דקות.") {
    super(message, "RATE_LIMITED", 429);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

/** Image storage is not configured for this environment (e.g. Vercel without STORAGE_DRIVER=s3). */
export class StorageNotConfiguredError extends AppError {
  constructor(message = "העלאת תמונות אינה זמינה כרגע: אחסון התמונות לא הוגדר בשרת. אנא פנו למנהל האתר.") {
    super(message, "STORAGE_NOT_CONFIGURED", 503);
  }
}

/** The storage provider rejected or failed the request (network, permissions, bucket…). */
export class StorageFailedError extends AppError {
  constructor(message = "שמירת התמונה נכשלה. נסו שוב בעוד מספר רגעים.") {
    super(message, "STORAGE_FAILED", 502);
  }
}

export const GENERIC_ERROR = "משהו השתבש. נסו שוב.";

export function toSafeMessage(error: unknown) {
  if (error instanceof AppError) return error.message;
  console.error("[unexpected error]", error);
  return GENERIC_ERROR;
}
