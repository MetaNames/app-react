import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Record } from '../record';

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

vi.mock('@/lib/url', () => ({
  explorerTransactionUrl: vi.fn((tx: string) => `https://browser.testnet.partisiablockchain.com/transactions/${tx}`),
}));

vi.mock('@/lib/records', () => ({
  validateRecordValue: vi.fn(() => null),
  isUrlRecord: vi.fn(() => false),
}));

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, disabled, ...props }) => (
    <button disabled={disabled} data-testid={props['data-testid']} {...props}>
      {children}
    </button>
  )),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    open ? <div role="dialog" onChange={() => onOpenChange?.(false)}>{children}</div> : null
  ),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: vi.fn(({ value, onChange, ...props }: any) => (
    <textarea value={value} onChange={onChange} {...props} />
  )),
}));

const mockRepository = {
  update: vi.fn(),
  delete: vi.fn(),
};

const createMockIntent = () => ({
  send: vi.fn().mockResolvedValue('mock-tx-hash'),
  waitForConfirmation: vi.fn().mockResolvedValue(undefined),
});

const defaultProps = {
  type: 'Bio' as const,
  value: 'Test bio value',
  repository: mockRepository,
  onUpdate: vi.fn(),
};

describe('Record', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockRepository.update.mockReset();
    mockRepository.delete.mockReset();
  });

  describe('rendering', () => {
    it('renders record type and value', () => {
      render(<Record {...defaultProps} />);
      expect(screen.getByText('Bio')).toBeInTheDocument();
      expect(screen.getByText('Test bio value')).toBeInTheDocument();
    });

    it('renders edit and delete buttons', () => {
      render(<Record {...defaultProps} />);
      expect(screen.getByTestId('edit-record')).toBeInTheDocument();
      expect(screen.getByTestId('delete-record')).toBeInTheDocument();
    });

    it('renders different record types correctly', () => {
      const types: Array<{ type: 'Bio' | 'Email' | 'Twitter' | 'Discord'; value: string }> = [
        { type: 'Bio', value: 'My bio' },
        { type: 'Email', value: 'test@example.com' },
        { type: 'Twitter', value: '@user' },
        { type: 'Discord', value: 'user#1234' },
      ];

      types.forEach(({ type, value }) => {
        const { unmount } = render(<Record {...defaultProps} type={type} value={value} />);
        expect(screen.getByText(type)).toBeInTheDocument();
        expect(screen.getByText(value)).toBeInTheDocument();
        unmount();
      });
    });

    it('renders Price record with $ suffix', () => {
      render(<Record {...defaultProps} type="Price" value="100" />);
      expect(screen.getByText('100 $')).toBeInTheDocument();
    });

    it('renders Wallet type correctly', () => {
      render(<Record {...defaultProps} type="Wallet" value="0x1234567890abcdef" />);
      expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('enters edit mode when edit button is clicked', () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-record'));
      expect(screen.getByTestId('save-record')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-edit')).toBeInTheDocument();
    });

    it('shows textarea in edit mode', () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-record'));
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('Test bio value');
    });

    it('cancels edit mode and restores original value', () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-record'));
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Modified value' } });
      
      fireEvent.click(screen.getByTestId('cancel-edit'));
      
      expect(screen.getByText('Test bio value')).toBeInTheDocument();
      expect(screen.queryByTestId('save-record')).not.toBeInTheDocument();
    });

    it('clears edit error when canceling', () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-record'));
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Modified value' } });
      
      fireEvent.click(screen.getByTestId('cancel-edit'));
      
      expect(screen.queryByText('Value is required')).not.toBeInTheDocument();
    });

    it('shows character count in edit mode', () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-record'));
      expect(screen.getByText('14/64')).toBeInTheDocument();
    });
  });

  describe('save functionality', () => {
    it('calls repository.update with correct parameters', async () => {
      const mockIntent = createMockIntent();
      mockRepository.update.mockResolvedValue(mockIntent);
      
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-record'));
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Updated bio' } });
      
      fireEvent.click(screen.getByTestId('save-record'));
      
      await waitFor(() => {
        expect(mockRepository.update).toHaveBeenCalledWith({ class: 0, data: 'Updated bio' });
      });
    });

    it('calls onUpdate after successful save', async () => {
      const mockIntent = createMockIntent();
      mockRepository.update.mockResolvedValue(mockIntent);
      
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-record'));
      fireEvent.click(screen.getByTestId('save-record'));
      
      await waitFor(() => {
        expect(defaultProps.onUpdate).toHaveBeenCalled();
      });
    });

    it('exits edit mode after successful save', async () => {
      const mockIntent = createMockIntent();
      mockRepository.update.mockResolvedValue(mockIntent);
      
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-record'));
      fireEvent.click(screen.getByTestId('save-record'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('save-record')).not.toBeInTheDocument();
      });
    });

    it('shows toast with transaction link', async () => {
      const { toast } = await import('sonner');
      const mockIntent = createMockIntent();
      mockRepository.update.mockResolvedValue(mockIntent);
      
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-record'));
      fireEvent.click(screen.getByTestId('save-record'));
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('New Transaction submitted', expect.objectContaining({
          duration: 10000,
        }));
      });
    });

    it('displays validation error when validateRecordValue returns error', async () => {
      const { validateRecordValue } = await import('@/lib/records');
      vi.mocked(validateRecordValue).mockReturnValue('Value is required');
      
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-record'));
      fireEvent.click(screen.getByTestId('save-record'));
      
      await waitFor(() => {
        expect(screen.getByText('Value is required')).toBeInTheDocument();
      });
      
      vi.mocked(validateRecordValue).mockReturnValue(null);
    });

    it('does not call repository.update when validation fails', async () => {
      const { validateRecordValue } = await import('@/lib/records');
      vi.mocked(validateRecordValue).mockReturnValue('Value is required');
      
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-record'));
      fireEvent.click(screen.getByTestId('save-record'));
      
      await waitFor(() => {
        expect(mockRepository.update).not.toHaveBeenCalled();
      });
      
      vi.mocked(validateRecordValue).mockReturnValue(null);
    });
  });

  describe('delete functionality', () => {
    it('opens delete dialog when delete button is clicked', () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-record'));
      expect(screen.getByText('Confirm action')).toBeInTheDocument();
      expect(screen.getByText('Do you really want to remove the record?')).toBeInTheDocument();
    });

    it('closes delete dialog when No button is clicked', () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-record'));
      fireEvent.click(screen.getByText('No'));
      expect(screen.queryByText('Confirm action')).not.toBeInTheDocument();
    });

    it('calls repository.delete with correct class when confirmed', async () => {
      const mockIntent = createMockIntent();
      mockRepository.delete.mockResolvedValue(mockIntent);
      
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-record'));
      fireEvent.click(screen.getByText('Yes'));
      
      await waitFor(() => {
        expect(mockRepository.delete).toHaveBeenCalledWith(0);
      });
    });

    it('calls onUpdate after successful delete', async () => {
      const mockIntent = createMockIntent();
      mockRepository.delete.mockResolvedValue(mockIntent);
      
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-record'));
      fireEvent.click(screen.getByText('Yes'));
      
      await waitFor(() => {
        expect(defaultProps.onUpdate).toHaveBeenCalled();
      });
    });

    it('closes dialog after successful delete', async () => {
      const mockIntent = createMockIntent();
      mockRepository.delete.mockResolvedValue(mockIntent);
      
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-record'));
      fireEvent.click(screen.getByText('Yes'));
      
      await waitFor(() => {
        expect(screen.queryByText('Confirm action')).not.toBeInTheDocument();
      });
    });

    it('shows toast with transaction link on delete', async () => {
      const { toast } = await import('sonner');
      const mockIntent = createMockIntent();
      mockRepository.delete.mockResolvedValue(mockIntent);
      
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-record'));
      fireEvent.click(screen.getByText('Yes'));
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('New Transaction submitted', expect.objectContaining({
          duration: 10000,
        }));
      });
    });
  });

  describe('URL record rendering', () => {
    it('renders URL record as clickable link when isUrlRecord returns true', async () => {
      const { isUrlRecord } = await import('@/lib/records');
      vi.mocked(isUrlRecord).mockReturnValue(true);
      
      render(<Record {...defaultProps} type="Uri" value="https://example.com" />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
