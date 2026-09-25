import React from 'react';

/**
 * EditorialPageHeader
 * 
 * Reusable editorial header for public and educational pages in the Cyber Law Awareness Portal.
 * Structure:
 * - Top children (e.g., WorkspaceBreadcrumb)
 * - Eyebrow: Small, uppercase, letter-spacing 0.05em
 * - Title: 32–40px, deep navy, letter-spacing -0.02em
 * - Subtitle (optional): 18–20px, italic lead text
 * - Description (optional): 16px, line-height 1.68, max-width 720px
 * - Bottom children (e.g., disclaimer notice, action buttons)
 */
export default function EditorialPageHeader({
  eyebrow,
  title,
  subtitle,
  description,
  children,
  className = '',
  topContent = null
}) {
  return (
    <header className={`page-header-editorial ${className}`}>
      {topContent}
      {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
      {title && <h1 className="page-title">{title}</h1>}
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
      {description && <p className="page-description">{description}</p>}
      {children}
    </header>
  );
}
