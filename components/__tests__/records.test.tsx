import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Records } from '../records';

vi.mock('sonner', () => {
  const fn = vi.fn((message: string) => message);
  return {
    toast: Object.assign(fn, {
      success: vi.fn((message: string) => message),
      error: vi.fn((message: string) => message),
    }),
  };
});

vi.mock('@/lib/url', () => ({
  explorerTransactionUrl: vi.fn((tx: string) => `https://browser.testnet.partisiablockchain.com/transactions/${tx}`),
}));

vi.mock('@/lib/records', () => ({
  validateRecordValue: vi.fn(() => null),
  isUrlRecord: vi.fn(() => false),
}));

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, disabled, ...props }: any) => (
    <button disabled={disabled} data-testid={props['data-testid']} {...props}>
      {children}
    </button>
  )),
}));

let mockOnValueChange: ((value: string) => void) | null = null;

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => {
    mockOnValueChange = onValueChange;
    return (
      <div data-testid="select" data-value={value}>
        {children}
      </div>
    );
  },
  SelectTrigger: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder || 'Select value'}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => (
    <div
      data-testid={`select-option-${value}`}
      data-value={value}
      onClick={() => mockOnValueChange?.(value)}
      {...props}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: vi.fn(({ value, onChange, placeholder, ...props }: any) => (
    <textarea value={value} onChange={onChange} placeholder={placeholder} {...props} />
  )),
}));

const mockRepository = {
  create: vi.fn(),
};

const createMockIntent = () => ({
  send: vi.fn().mockResolvedValue('mock-tx-hash'),
  waitForConfirmation: vi.fn().mockResolvedValue(undefined),
});

const defaultProps = {
  records: {} as Record<string, string>,
  repository: mockRepository,
  onUpdate: vi.fn(),
};

describe('Records', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockRepository.create.mockReset();
  });

  describe('rendering', () => {
    it('renders empty state when no records', () => {
      render(<Records {...defaultProps} />);
      expect(screen.getByText('No records found')).toBeInTheDocument();
    });

    it('renders add record form when no records (all types available)', () => {
      render(<Records {...defaultProps} />);
      expect(screen.getAllByText('Add record').length).toBeGreaterThan(0);
    });

    it('renders record when records exist', () => {
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      expect(screen.getByText('Bio')).toBeInTheDocument();
      expect(screen.getByText('Test bio')).toBeInTheDocument();
    });

    it('renders multiple records', () => {
      const records = {
        Bio: 'Test bio',
        Email: 'test@example.com',
        Twitter: '@user',
      };
      render(<Records {...defaultProps} records={records} repository={mockRepository} />);
      
      expect(screen.getByText('Bio')).toBeInTheDocument();
      expect(screen.getByText('Test bio')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Twitter')).toBeInTheDocument();
      expect(screen.getByText('@user')).toBeInTheDocument();
    });

    it('renders add record form when available types exist', () => {
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      expect(screen.getAllByText('Add record').length).toBeGreaterThan(0);
    });
  });

  describe('add record form', () => {
    it('renders record type dropdown', () => {
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      expect(screen.getByText('Select record type')).toBeInTheDocument();
    });

    it('does not show textarea when no type selected', () => {
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('shows textarea when type is selected', async () => {
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });

    it('shows character count when type selected', async () => {
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      await waitFor(() => {
        expect(screen.getByText('0/64')).toBeInTheDocument();
      });
    });

    it('shows correct placeholder for selected type', async () => {
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Twitter'));
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter Twitter value...')).toBeInTheDocument();
      });
    });

    it('disables add button when no type selected', () => {
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      expect(screen.getByRole('button', { name: 'Add record' })).toBeDisabled();
    });

    it('disables add button when type selected but no value', async () => {
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add record' })).toBeDisabled();
      });
    });

    it('enables add button when type and value are filled', async () => {
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test@example.com' } });
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add record' })).toBeEnabled();
      });
    });
  });

  describe('add record functionality', () => {
    it('calls repository.create with correct parameters', async () => {
      const mockIntent = createMockIntent();
      mockRepository.create.mockResolvedValue(mockIntent);
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test@example.com' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(mockRepository.create).toHaveBeenCalledWith({ class: 6, data: 'test@example.com' });
      });
    });

    it('calls onUpdate after successful add', async () => {
      const mockIntent = createMockIntent();
      mockRepository.create.mockResolvedValue(mockIntent);
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test@example.com' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(defaultProps.onUpdate).toHaveBeenCalled();
      });
    });

    it('clears form after successful add', async () => {
      const mockIntent = createMockIntent();
      mockRepository.create.mockResolvedValue(mockIntent);
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test@example.com' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(screen.getByText('Select record type')).toBeInTheDocument();
      });
    });

    it('shows toast with transaction link', async () => {
      const { toast } = await import('sonner');
      const mockIntent = createMockIntent();
      mockRepository.create.mockResolvedValue(mockIntent);
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test@example.com' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('New Transaction submitted', expect.objectContaining({
          duration: 10000,
        }));
      });
    });

    it('does not call repository.create when validation fails', async () => {
      const { validateRecordValue } = await import('@/lib/records');
      vi.mocked(validateRecordValue).mockReturnValue('Must be a valid email');
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'invalid-email' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(mockRepository.create).not.toHaveBeenCalled();
      });
      
      vi.mocked(validateRecordValue).mockReturnValue(null);
    });

    it('displays validation error when validation fails', async () => {
      const { validateRecordValue } = await import('@/lib/records');
      vi.mocked(validateRecordValue).mockReturnValue('Must be a valid email');
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'invalid-email' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(screen.getByText('Must be a valid email')).toBeInTheDocument();
      });
      
      vi.mocked(validateRecordValue).mockReturnValue(null);
    });

    it('clears error when type changes', async () => {
      const { validateRecordValue } = await import('@/lib/records');
      vi.mocked(validateRecordValue).mockReturnValue('Must be a valid email');
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'invalid-email' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(screen.getByText('Must be a valid email')).toBeInTheDocument();
      });
      
      vi.mocked(validateRecordValue).mockReturnValue(null);
      
      fireEvent.click(screen.getByTestId('select-option-Twitter'));
      
      await waitFor(() => {
        expect(screen.queryByText('Must be a valid email')).not.toBeInTheDocument();
      });
    });

    it('clears error when value changes', async () => {
      const { validateRecordValue } = await import('@/lib/records');
      vi.mocked(validateRecordValue).mockReturnValue('Must be a valid email');
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'invalid-email' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(screen.getByText('Must be a valid email')).toBeInTheDocument();
      });
      
      vi.mocked(validateRecordValue).mockReturnValue(null);
      
      fireEvent.change(textarea, { target: { value: 'valid@email.com' } });
      
      await waitFor(() => {
        expect(screen.queryByText('Must be a valid email')).not.toBeInTheDocument();
      });
    });
  });

  describe('available types filtering', () => {
    it('shows only unused record types in dropdown', () => {
      render(<Records {...defaultProps} records={{ Bio: 'Test bio', Email: 'test@example.com' }} repository={mockRepository} />);
      
      expect(screen.getByTestId('select-option-Twitter')).toBeInTheDocument();
      expect(screen.getByTestId('select-option-Discord')).toBeInTheDocument();
      expect(screen.queryByTestId('select-option-Bio')).toBeNull();
      expect(screen.queryByTestId('select-option-Email')).toBeNull();
    });

    it('does not show add form when all types are used', () => {
      const allRecords = {
        Bio: 'Bio value',
        Email: 'email@example.com',
        Twitter: '@user',
        Discord: 'user#1234',
        Wallet: '0x123',
        Price: '100',
        Uri: 'https://example.com',
        Avatar: 'https://avatar.example.com',
        Main: 'main value',
      };
      render(<Records {...defaultProps} records={allRecords} repository={mockRepository} />);
      expect(screen.queryByText('Add record')).toBeNull();
    });
  });

  describe('validation', () => {
    it('validates whitespace-only value', async () => {
      const { validateRecordValue } = await import('@/lib/records');
      vi.mocked(validateRecordValue).mockReturnValue('Value is required');
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   ' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(screen.getByText('Value is required')).toBeInTheDocument();
      });
      
      vi.mocked(validateRecordValue).mockReturnValue(null);
    });

    it('validates max 64 characters', async () => {
      const { validateRecordValue } = await import('@/lib/records');
      vi.mocked(validateRecordValue).mockReturnValue('Max 64 characters');
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Email'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'a'.repeat(65) } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(screen.getByText('Max 64 characters')).toBeInTheDocument();
      });
      
      vi.mocked(validateRecordValue).mockReturnValue(null);
    });

    it('validates URL for Uri type', async () => {
      const { validateRecordValue } = await import('@/lib/records');
      vi.mocked(validateRecordValue).mockReturnValue('Must be a valid URL');
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Uri'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'not-a-url' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(screen.getByText('Must be a valid URL')).toBeInTheDocument();
      });
      
      vi.mocked(validateRecordValue).mockReturnValue(null);
    });

    it('validates number for Price type', async () => {
      const { validateRecordValue } = await import('@/lib/records');
      vi.mocked(validateRecordValue).mockReturnValue('Must be a number');
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Price'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'not-a-number' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(screen.getByText('Must be a number')).toBeInTheDocument();
      });
      
      vi.mocked(validateRecordValue).mockReturnValue(null);
    });
  });

  describe('RecordClass mapping', () => {
    it('maps Twitter record type correctly', async () => {
      const mockIntent = createMockIntent();
      mockRepository.create.mockResolvedValue(mockIntent);
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Twitter'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: '@user' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(mockRepository.create).toHaveBeenCalledWith({ class: 2, data: '@user' });
      });
    });

    it('maps Discord record type correctly', async () => {
      const mockIntent = createMockIntent();
      mockRepository.create.mockResolvedValue(mockIntent);
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Discord'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'user#1234' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(mockRepository.create).toHaveBeenCalledWith({ class: 1, data: 'user#1234' });
      });
    });

    it('maps Uri record type correctly', async () => {
      const mockIntent = createMockIntent();
      mockRepository.create.mockResolvedValue(mockIntent);
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Uri'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'https://example.com' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(mockRepository.create).toHaveBeenCalledWith({ class: 3, data: 'https://example.com' });
      });
    });

    it('maps Wallet record type correctly', async () => {
      const mockIntent = createMockIntent();
      mockRepository.create.mockResolvedValue(mockIntent);
      
      render(<Records {...defaultProps} records={{ Bio: 'Test bio' }} repository={mockRepository} />);
      
      fireEvent.click(screen.getByTestId('select-option-Wallet'));
      
      const textarea = await screen.findByRole('textbox');
      fireEvent.change(textarea, { target: { value: '0x1234567890abcdef' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
      
      await waitFor(() => {
        expect(mockRepository.create).toHaveBeenCalledWith({ class: 4, data: '0x1234567890abcdef' });
      });
    });
  });
});
