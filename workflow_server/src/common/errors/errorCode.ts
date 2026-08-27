export enum ErrorCode {
  UNAUTHORIZED = 'ERR_UNAUTHORIZED',
  INVALID_INPUT = 'ERR_INVALID_INPUT',
  NOT_FOUND = 'ERR_NOT_FOUND',
  RESTRICTED_PERMISSION = 'ERR_RESTRICTED_PERMISSION',
  PROJECT_ALREADY_EXISTS = 'ERR_PROJECT_ALREADY_EXISTS',
  INTERNAL_SERVER_ERROR = 'ERR_INTERNAL_SERVER_ERROR',
}

export class AppError extends Error {
  public statusCode: number;
  public errorCode: ErrorCode;

  constructor(message: string, statusCode: number = 400, errorCode: ErrorCode = ErrorCode.INVALID_INPUT) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}
