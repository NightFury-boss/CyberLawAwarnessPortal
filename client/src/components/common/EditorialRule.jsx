import React from 'react';

/**
 * EditorialRule
 * 
 * Reusable 1px hairline horizontal divider matching the portal's neutral border token.
 * Provides consistent vertical rhythm across editorial pages.
 */
export default function EditorialRule({
  spacing = 'lg', // 'sm' | 'md' | 'lg' | 'xl' | 'none'
  className = '',
  style = {}
}) {
  const spacingMap = {
    none: '0',
    sm: 'var(--space-md) 0',
    md: 'var(--space-lg) 0',
    lg: 'var(--space-xl) 0',
    xl: 'var(--space-xxl) 0'
  };

  return (
    <hr
      className={`editorial-rule ${className}`}
      aria-hidden="true"
      style={{
        border: 'none',
        borderTop: '1px solid var(--color-border)',
        margin: spacingMap[spacing] || spacingMap.lg,
        padding: 0,
        width: '100%',
        ...style
      }}
    />
  );
}
