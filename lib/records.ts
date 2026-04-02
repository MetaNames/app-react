import type { RecordClass } from './types';
export function validateRecordValue(type: RecordClass, value: string): string | null {
  if (!value?.trim()) return 'Value is required';
  if (value.length > 64) return 'Max 64 characters';
  if (['Uri','Avatar'].includes(type)) { try { new URL(value); } catch { return 'Must be a valid URL'; } }
  if (type === 'Email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Must be a valid email';
  if (type === 'Price' && isNaN(Number(value))) return 'Must be a number';
  return null;
}
export const isUrlRecord = (type: RecordClass) => ['Uri','Avatar'].includes(type);
