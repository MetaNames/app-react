import { describe, it, expect } from 'vitest';
import { InsufficientBalanceError, isInsufficientBalanceError } from '../error';

describe('InsufficientBalanceError', () => {
  it('should have correct coin property and message', () => {
    const error = new InsufficientBalanceError('BTC');
    expect(error.coin).toBe('BTC');
    expect(error.message).toBe('Insufficient balance for BTC');
  });

  it('should have name property set to InsufficientBalanceError', () => {
    const error = new InsufficientBalanceError('ETH');
    expect(error.name).toBe('InsufficientBalanceError');
  });

  it('should be an instance of Error', () => {
    const error = new InsufficientBalanceError('SOL');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('isInsufficientBalanceError', () => {
  it('should return true for an InsufficientBalanceError instance', () => {
    const error = new InsufficientBalanceError('BTC');
    expect(isInsufficientBalanceError(error)).toBe(true);
  });

  it('should return false for a regular Error', () => {
    const error = new Error('Some error');
    expect(isInsufficientBalanceError(error)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isInsufficientBalanceError(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isInsufficientBalanceError(undefined)).toBe(false);
  });
});
