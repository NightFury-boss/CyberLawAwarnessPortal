import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './Breadcrumb';
import { WORKSPACE_ROUTE_METADATA, WORKSPACE_ROOT } from './workspaceRouteMetadata';

/**
 * WorkspaceBreadcrumb
 *
 * Restrained, semantic in-content breadcrumb navigation for authenticated Workspace.
 * 
 * Hierarchy:
 * Desktop/Mobile: Workspace / [Category] [/ Current Item]
 *
 * Guarantees:
 * - Only renders on /workspace/* routes (returns null on public routes).
 * - "Workspace" root points to authenticated /dashboard.
 * - Current item is non-interactive <span aria-current="page">.
 * - Fully keyboard accessible and responsive with text truncation on deep titles.
 */
export default function WorkspaceBreadcrumb({
  currentItem,
  onParentClick,
  items,
  className = '',
  style = {},
}) {
  const location = useLocation();

  // Guard: Breadcrumb belongs strictly inside the Workspace content area
  const isWorkspace = location.pathname.startsWith('/workspace');
  if (!isWorkspace) {
    return null;
  }

  // Detect route metadata for the current workspace path
  const currentRouteMeta = WORKSPACE_ROUTE_METADATA[location.pathname] || {
    label: location.pathname.split('/').filter(Boolean).pop() || 'Content',
    path: location.pathname,
  };

  // If custom items are provided, render them directly with Workspace root
  if (items && items.length > 0) {
    return (
      <Breadcrumb className={className} style={style}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={WORKSPACE_ROOT.path}>{WORKSPACE_ROOT.label}</BreadcrumbLink>
          </BreadcrumbItem>
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <React.Fragment key={idx}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage title={item.label}>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink to={item.to} onClick={item.onClick}>
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Default hierarchical rendering based on active route and optional deep currentItem
  return (
    <Breadcrumb className={className} style={style}>
      <BreadcrumbList>
        {/* Root ancestor: Workspace -> /dashboard */}
        <BreadcrumbItem>
          <BreadcrumbLink to={WORKSPACE_ROOT.path}>{WORKSPACE_ROOT.label}</BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {/* Category Item */}
        <BreadcrumbItem>
          {currentItem ? (
            <BreadcrumbLink to={currentRouteMeta.path} onClick={onParentClick}>
              {currentRouteMeta.label}
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{currentRouteMeta.label}</BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {/* Deep Item (if a specific incident, law, or threat is selected) */}
        {currentItem && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage title={currentItem}>{currentItem}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
