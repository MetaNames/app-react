import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../footer';
import { config } from '@/lib/config';

vi.mock('@/lib/config', () => ({
  config: {
    landingUrl: 'https://metanames.app',
  },
}));

describe('Footer', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<Footer />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('renders footer element', () => {
      render(<Footer />);
      const footer = document.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('has correct structural classes', () => {
      render(<Footer />);
      const footer = document.querySelector('footer');
      expect(footer).toHaveClass('border-t', 'border-border', 'mt-auto', 'py-6');
    });
  });

  describe('links', () => {
    it('renders all 5 links', () => {
      render(<Footer />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(5);
    });

    it('renders Landing link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: 'Landing' })).toBeInTheDocument();
    });

    it('renders Docs link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: 'Docs' })).toBeInTheDocument();
    });

    it('renders Telegram link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: 'Telegram' })).toBeInTheDocument();
    });

    it('renders Twitter link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: 'Twitter' })).toBeInTheDocument();
    });

    it('renders GitHub link', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    });
  });

  describe('href attributes', () => {
    it('Landing link has correct href', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: 'Landing' })).toHaveAttribute('href', 'https://metanames.app');
    });

    it('Docs link has correct href', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', 'https://docs.metanames.app');
    });

    it('Telegram link has correct href', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: 'Telegram' })).toHaveAttribute('href', 'https://t.me/mpc_metanames');
    });

    it('Twitter link has correct href', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: 'Twitter' })).toHaveAttribute('href', 'https://x.com/metanames_');
    });

    it('GitHub link has correct href', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/metanames');
    });
  });

  describe('link attributes', () => {
    it('all links open in new tab (target=_blank)', () => {
      render(<Footer />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
      });
    });

    it('all links have rel="noopener noreferrer"', () => {
      render(<Footer />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('styling', () => {
    it('links have text-sm class', () => {
      render(<Footer />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('text-sm');
      });
    });

    it('links have muted-foreground color class', () => {
      render(<Footer />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('text-muted-foreground');
      });
    });

    it('links have hover styling classes', () => {
      render(<Footer />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('hover:text-foreground', 'transition-colors');
      });
    });
  });

  describe('container', () => {
    it('links container has container mx-auto px-4 classes', () => {
      render(<Footer />);
      const container = document.querySelector('footer > div');
      expect(container).toHaveClass('container', 'mx-auto', 'px-4');
    });

    it('links container has flex-wrap and gap classes', () => {
      render(<Footer />);
      const container = document.querySelector('footer > div');
      expect(container).toHaveClass('flex', 'flex-wrap', 'gap-4', 'justify-center');
    });
  });
});
