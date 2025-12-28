import React from 'react';
import { cn } from '../../utils/helpers';
import { UI_CLASSES } from '../../utils/constants';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Content: React.FC<CardContentProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ children, className, padding = true }) => {
  return (
    <div className={cn(UI_CLASSES.card, className)}>
      {padding ? <div className="p-6">{children}</div> : children}
    </div>
  );
};

Card.Header = ({ children, className }) => (
  <header className={cn('px-6 py-4 border-b border-gray-200', className)}>{children}</header>
);

Card.Content = ({ children, className }) => (
  <main className={cn('p-6', className)}>{children}</main>
);

Card.Footer = ({ children, className }) => (
  <footer className={cn('px-6 py-4 bg-gray-50 border-t border-gray-200', className)}>
    {children}
  </footer>
);
