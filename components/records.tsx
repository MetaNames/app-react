'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Record } from '@/components/record';
import { validateRecordValue } from '@/lib/records';
import { ALL_RECORD_TYPES, type RecordClass } from '@/lib/types';
import { toast } from 'sonner';
import { explorerTransactionUrl } from '@/lib/url';
import { RecordClassEnum } from '@metanames/sdk';

const RECORD_CLASS_MAP: Record<string, number> = {
  Bio: RecordClassEnum.Bio,
  Discord: RecordClassEnum.Discord,
  Twitter: RecordClassEnum.Twitter,
  Uri: RecordClassEnum.Uri,
  Wallet: RecordClassEnum.Wallet,
  Avatar: RecordClassEnum.Avatar,
  Email: RecordClassEnum.Email,
  Price: RecordClassEnum.Price,
  Main: RecordClassEnum.Main,
};

interface RecordsProps { records: Record<string, string>; repository: any; onUpdate: () => void; }

export function Records({ records, repository, onUpdate }: RecordsProps) {
  const [newType, setNewType] = useState<RecordClass | ''>('');
  const [newValue, setNewValue] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const usedTypes = Object.keys(records) as RecordClass[];
  const availableTypes = ALL_RECORD_TYPES.filter((t) => !usedTypes.includes(t));

  const handleAdd = async () => {
    if (!newType) return;
    const err = validateRecordValue(newType, newValue);
    if (err) { setAddError(err); return; }
    const classValue = RECORD_CLASS_MAP[newType];
    if (classValue === undefined) { setAddError(`Unsupported record type: ${newType}`); return; }
    const intent = await repository.create({ class: classValue, data: newValue });
    const txHash = await intent.send();
    toast('New Transaction submitted', { action: { label: 'View', onClick: () => window.open(explorerTransactionUrl(txHash), '_blank') }, duration: 10000 });
    await intent.waitForConfirmation();
    setNewType(''); setNewValue(''); setAddError(null);
    onUpdate();
  };

  return (
    <div className="records flex flex-col gap-4">
      {usedTypes.length === 0 && <p className="text-muted-foreground text-sm">No records found</p>}
      {usedTypes.map((type) => <Record key={type} type={type} value={records[type]} repository={repository} onUpdate={onUpdate} />)}
      {availableTypes.length > 0 && (
        <Card className="add-record">
          <CardHeader><CardTitle className="text-sm">Add record</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Select value={newType} onValueChange={(v) => { setNewType(v as RecordClass); setAddError(null); }}>
              <SelectTrigger><SelectValue placeholder="Select record type" /></SelectTrigger>
              <SelectContent>{availableTypes.map((t) => <SelectItem key={t} value={t} data-testid={`select-option-${t}`}>{t}</SelectItem>)}</SelectContent>
            </Select>
            {newType && (
              <div className="flex flex-col gap-1">
                <Textarea placeholder={`Enter ${newType} value...`} value={newValue} onChange={(e) => { setNewValue(e.target.value); setAddError(null); }} rows={2} maxLength={64} />
                <div className="flex justify-between text-xs text-muted-foreground">{addError && <span className="text-destructive">{addError}</span>}<span className="ml-auto">{newValue.length}/64</span></div>
              </div>
            )}
            <Button disabled={!newType || !newValue} onClick={handleAdd}>Add record</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}