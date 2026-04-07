export class ActionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export class ValidationError extends ActionError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class DomainNotAvailableError extends ActionError {
  constructor(domain: string) {
    super(`Domain ${domain} is not available`, "DOMAIN_NOT_AVAILABLE", 409);
    this.name = "DomainNotAvailableError";
  }
}

export class InsufficientBalanceError extends ActionError {
  constructor(coin: string) {
    super(`Insufficient balance for ${coin}`, "INSUFFICIENT_BALANCE", 402);
    this.name = "InsufficientBalanceError";
  }
}

export class NotDomainOwnerError extends ActionError {
  constructor(domain: string) {
    super(`You do not own domain ${domain}`, "NOT_OWNER", 403);
    this.name = "NotDomainOwnerError";
  }
}

export class DomainNotFoundError extends ActionError {
  constructor(domain: string) {
    super(`Domain ${domain} not found`, "DOMAIN_NOT_FOUND", 404);
    this.name = "DomainNotFoundError";
  }
}

export class RecordNotFoundError extends ActionError {
  constructor(recordClass: string) {
    super(`Record ${recordClass} not found`, "RECORD_NOT_FOUND", 404);
    this.name = "RecordNotFoundError";
  }
}

export function isActionError(e: unknown): e is ActionError {
  return e instanceof ActionError;
}
