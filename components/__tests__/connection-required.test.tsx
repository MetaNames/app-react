import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionRequired } from '../connection-required';
import { useWalletStore } from '@/lib/stores/wallet-store';

vi.mock('@/lib/stores/wallet-store');

const mockUseWalletStore = useWalletStore as unknown as ReturnType<typeof vi.fn>;

describe('ConnectionRequired', () => {
  beforeEach(() => {
    mockUseWalletStore.mockClear();
  });

  describe('when address exists', () => {
    it('shows children when address exists', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: '0x1234567890abcdef' }));
      
      render(<ConnectionRequired><div data-testid="children">Protected Content</div></ConnectionRequired>);
      
      expect(screen.getByTestId('children')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: '0x1234567890abcdef' }));
      
      render(
        <ConnectionRequired>
          <span>Child 1</span>
          <span>Child 2</span>
        </ConnectionRequired>
      );
      
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('does not show fallback when address exists', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: '0x1234567890abcdef' }));
      
      render(
        <ConnectionRequired fallback={<div>Fallback Content</div>}>
          <div>Children</div>
        </ConnectionRequired>
      );
      
      expect(screen.queryByText('Fallback Content')).not.toBeInTheDocument();
    });

    it('does not show default message when address exists', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: '0x1234567890abcdef' }));
      
      render(<ConnectionRequired><div>Children</div></ConnectionRequired>);
      
      expect(screen.queryByText('Connect your wallet to continue')).not.toBeInTheDocument();
    });
  });

  describe('when no address', () => {
    it('shows fallback when provided and no address', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: undefined }));
      
      render(<ConnectionRequired fallback={<div data-testid="fallback">Please connect</div>}>
        <div>Children</div>
      </ConnectionRequired>);
      
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
      expect(screen.getByText('Please connect')).toBeInTheDocument();
    });

    it('shows default message when no address and no fallback', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: undefined }));
      
      render(<ConnectionRequired><div>Children</div></ConnectionRequired>);
      
      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });

    it('does not show children when no address', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: undefined }));
      
      render(<ConnectionRequired><div data-testid="children">Protected Content</div></ConnectionRequired>);
      
      expect(screen.queryByTestId('children')).not.toBeInTheDocument();
    });

    it('shows fallback content correctly formatted', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: undefined }));
      
      render(
        <ConnectionRequired fallback={<button>Connect Wallet</button>}>
          <div>Content</div>
        </ConnectionRequired>
      );
      
      expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeInTheDocument();
    });
  });

  describe('default fallback message', () => {
    it('has correct styling classes for default message', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: undefined }));
      
      render(<ConnectionRequired><div>Content</div></ConnectionRequired>);
      
      const message = screen.getByText('Connect your wallet to continue');
      expect(message).toHaveClass('text-muted-foreground', 'text-lg');
    });

    it('default message is centered', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: undefined }));
      
      render(<ConnectionRequired><div>Content</div></ConnectionRequired>);
      
      const container = screen.getByText('Connect your wallet to continue').parentElement;
      expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'py-12', 'text-center', 'gap-4');
    });
  });

  describe('edge cases', () => {
    it('handles empty string address as no address', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: '' }));
      
      render(<ConnectionRequired><div>Content</div></ConnectionRequired>);
      
      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });

    it('handles null address explicitly', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: null as unknown as undefined }));
      
      render(<ConnectionRequired><div>Content</div></ConnectionRequired>);
      
      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });

    it('works with complex fallback components', () => {
      mockUseWalletStore.mockImplementation((selector) => selector({ address: undefined }));
      
      render(
        <ConnectionRequired
          fallback={
            <div>
              <h2>Title</h2>
              <p>Description</p>
              <button>Action</button>
            </div>
          }
        >
          <div>Content</div>
        </ConnectionRequired>
      );
      
      expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });
});
