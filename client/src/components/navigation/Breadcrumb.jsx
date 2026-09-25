import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Semantic Breadcrumb Primitives for Cyber Law Awareness Portal
 * Built on pure React 19 + React Router 6 with strict accessibility.
 */

export function Breadcrumb({ className = '', children, ...props }) {
  return (
    <nav aria-label="breadcrumb" className={`workspace-content-breadcrumb ${className}`} {...props}>
      {children}
    </nav>
  );
}

export function BreadcrumbList({ className = '', children, ...props }) {
  return (
    <ol className={`workspace-breadcrumb-ol ${className}`} {...props}>
      {children}
    </ol>
  );
}

export function BreadcrumbItem({ className = '', children, ...props }) {
  return (
    <li className={`workspace-breadcrumb-li ${className}`} {...props}>
      {children}
    </li>
  );
}

export function BreadcrumbLink({ to, onClick, className = '', children, ...props }) {
  if (to) {
    return (
      <Link to={to} onClick={onClick} className={`workspace-content-breadcrumb-link ${className}`} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`workspace-content-breadcrumb-link workspace-breadcrumb-btn ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BreadcrumbPage({ className = '', children, ...props }) {
  return (
    <span
      aria-current="page"
      className={`workspace-content-breadcrumb-current ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function BreadcrumbSeparator({ children, className = '', ...props }) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={`workspace-content-breadcrumb-separator ${className}`}
      {...props}
    >
      {children || (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </li>
  );
}

export function BreadcrumbEllipsis({ className = '', ...props }) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={`workspace-breadcrumb-ellipsis ${className}`}
      {...props}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
      <span className="sr-only">More</span>
    </span>
  );
}
