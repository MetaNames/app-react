import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoadingButton } from '../loading-button';

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, disabled, ...props }) => (
    <button disabled={disabled} data-testid={props['data-testid']} className={props.className} {...props}>
      {children}
    </button>
  )),
}));

describe('LoadingButton', () => {
  describe('rendering', () => {
    it('renders with children', () => {
      render(<LoadingButton>Click me</LoadingButton>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      render(<LoadingButton>Test</LoadingButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      render(<LoadingButton><span>Child 1</span><span>Child 2</span></LoadingButton>);
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading state with spinner', async () => {
      const onClick = vi.fn().mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));
      render(<LoadingButton onClick={onClick} loadingText="Please wait...">Submit</LoadingButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Please wait...')).toBeInTheDocument();
      });
      expect(screen.getByRole('button').querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows default loading text when loadingText not provided', async () => {
      const onClick = vi.fn().mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));
      render(<LoadingButton onClick={onClick}>Submit</LoadingButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('shows spinner icon when loading', async () => {
      const onClick = vi.fn().mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));
      render(<LoadingButton onClick={onClick}>Submit</LoadingButton>);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        const spinner = screen.getByRole('button').querySelector('svg');
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('disabled state', () => {
    it('is disabled when loading', async () => {
      const onClick = vi.fn().mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));
      render(<LoadingButton onClick={onClick}>Submit</LoadingButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeDisabled();
      });
    });

    it('is disabled when disabled prop is true', () => {
      render(<LoadingButton disabled>Submit</LoadingButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is not disabled when not loading and disabled prop is false', () => {
      render(<LoadingButton disabled={false}>Submit</LoadingButton>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('className prop', () => {
    it('passes className to the button', () => {
      render(<LoadingButton className="custom-class">Submit</LoadingButton>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('passes multiple classNames', () => {
      render(<LoadingButton className="class1 class2">Submit</LoadingButton>);
      expect(screen.getByRole('button')).toHaveClass('class1');
      expect(screen.getByRole('button')).toHaveClass('class2');
    });
  });

  describe('data-testid prop', () => {
    it('passes data-testid to the button', () => {
      render(<LoadingButton data-testid="test-button">Submit</LoadingButton>);
      expect(screen.getByTestId('test-button')).toBeInTheDocument();
    });

    it('works with data-testid and className together', () => {
      render(<LoadingButton data-testid="test-button" className="custom-class">Submit</LoadingButton>);
      const button = screen.getByTestId('test-button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('success state', () => {
    it('shows success state with check icon and children', async () => {
      const onClick = vi.fn().mockResolvedValue(undefined);
      render(<LoadingButton onClick={onClick}>Submit</LoadingButton>);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });
      
      const checkIcon = screen.getByRole('button').querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe('onClick handler', () => {
    it('calls onClick when clicked and not loading', () => {
      const onClick = vi.fn().mockResolvedValue(undefined);
      render(<LoadingButton onClick={onClick}>Submit</LoadingButton>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when already loading', async () => {
      const onClick = vi.fn().mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 200)));
      render(<LoadingButton onClick={onClick}>Submit</LoadingButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Try clicking again while loading
      fireEvent.click(button);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when no onClick provided', () => {
      render(<LoadingButton>Submit</LoadingButton>);
      const button = screen.getByRole('button');
      // Should not throw
      fireEvent.click(button);
    });
  });
});
