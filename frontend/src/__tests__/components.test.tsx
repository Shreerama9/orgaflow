import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, Card, Badge, Input, LoadingSpinner, EmptyState } from '../components/ui';

describe('UI Components', () => {
  describe('Button', () => {
    it('renders with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('shows loading spinner when isLoading', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies variant styles', () => {
      render(<Button variant="danger">Delete</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-red-600');
    });
  });

  describe('Card', () => {
    it('renders children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies hover class when hover prop is true', () => {
      render(<Card hover>Hoverable</Card>);
      expect(screen.getByText('Hoverable').parentElement).toHaveClass('cursor-pointer');
    });
  });

  describe('Badge', () => {
    it('renders with correct variant', () => {
      render(<Badge variant="success">Active</Badge>);
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('text-green-400');
    });
  });

  describe('Input', () => {
    it('renders with label', () => {
      render(<Input label="Email" placeholder="Enter email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('shows error message', () => {
      render(<Input error="Invalid email" />);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  describe('LoadingSpinner', () => {
    it('renders with default size', () => {
      render(<LoadingSpinner />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders title and description', () => {
      render(
        <EmptyState
          title="No items"
          description="Create your first item"
        />
      );
      expect(screen.getByText('No items')).toBeInTheDocument();
      expect(screen.getByText('Create your first item')).toBeInTheDocument();
    });
  });
});
