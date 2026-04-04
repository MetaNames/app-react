import type { RecordClass, RecordRepository } from './types';
import type { MetaNamesSdk } from '@metanames/sdk';

export function validateRecordValue(type: RecordClass, value: string): string | null {
  if (!value?.trim()) return 'Value is required';
  if (value.length > 64) return 'Max 64 characters';
  if (['Uri','Avatar'].includes(type)) { try { new URL(value); } catch { return 'Must be a valid URL'; } }
  if (type === 'Email' && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) return 'Must be a valid email';
  if (type === 'Price' && (value === '' || isNaN(Number(value)))) return 'Must be a number';
  return null;
}
export const isUrlRecord = (type: RecordClass) => ['Uri','Avatar'].includes(type);

export function createRecordRepository(sdk: MetaNamesSdk): RecordRepository {
  return {
    // @ts-expect-error - recordRepository not typed in SDK
    create: (params) => sdk.recordRepository.create(params),
    // @ts-expect-error - recordRepository not typed in SDK
    update: (params) => sdk.recordRepository.update(params),
    // @ts-expect-error - recordRepository not typed in SDK
    delete: (recordClass) => sdk.recordRepository.delete(recordClass),
  };
}
