

import React, { ReactNode, forwardRef } from 'react';
import { Loader2, X } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className = '', disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-surface-100 text-surface-900 border border-surface-200 hover:bg-surface-200 focus:ring-surface-400',
      danger: 'bg-danger text-white hover:bg-red-600 focus:ring-red-400',
      ghost: 'text-surface-600 hover:text-surface-900 hover:bg-surface-100 focus:ring-surface-400',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';




// Input Component

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 bg-white border border-surface-300 rounded-lg text-surface-900 placeholder-surface-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors ${error ? 'border-danger' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';




// Textarea Component

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-2.5 bg-white border border-surface-300 rounded-lg text-surface-900 placeholder-surface-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none ${error ? 'border-danger' : ''} ${className}`}
          rows={4}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';



interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div
      className={`bg-white rounded-xl p-5 border border-surface-200 shadow-sm ${hover ? 'cursor-pointer hover:border-primary-300 hover:shadow-md transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 animate-slide-up shadow-xl border border-surface-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-surface-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-surface-400 hover:text-surface-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};


export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return <Loader2 className={`${sizes[size]} animate-spin text-primary-600`} />;
};

export const LoadingPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-50">
    <LoadingSpinner size="lg" />
  </div>
);

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-surface-200 rounded ${className}`} />
);

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-surface-100 text-surface-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    info: 'bg-blue-50 text-blue-600',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

// =============================================================================
// Empty State Component
// =============================================================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && <div className="mb-4 text-surface-400">{icon}</div>}
    <h3 className="text-lg font-medium text-surface-700">{title}</h3>
    {description && <p className="mt-1 text-sm text-surface-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
