export class InsufficientBalanceError extends Error {
  constructor(public coin: string) { super(`Insufficient balance for ${coin}`); this.name = 'InsufficientBalanceError'; }
}
export const isInsufficientBalanceError = (e: unknown): e is InsufficientBalanceError => e instanceof InsufficientBalanceError;
