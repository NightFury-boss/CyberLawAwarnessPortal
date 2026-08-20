import React, { useState } from 'react';

/**
 * PortalSearch component standardizes the search input experience:
 * - standard control height, typography, border, and focus states.
 * - left functional SVG search icon.
 * - right keyboard-accessible SVG clear button (X).
 * - collapsible filter panels toggled via an outlined button.
 * - result count display and suggestion-rich empty states.
 */
function PortalSearch({
  placeholder = "Search...",
  searchQuery = "",
  onSearchChange,
  onClear,
  results = [],
  loading = false,
  resultTypeLabel = "results",
  emptyHeader = "NO MATCHING RESULTS",
  emptyText = "Try a different search term or keyword.",
  suggestions = [],
  showFiltersToggle = false,
  showFilters = false,
  onFiltersToggle,
  filtersDrawerContent = null,
  activeFiltersContent = null
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && onClear) {
      e.preventDefault();
      onClear();
    }
  };

  return (
    <div style={{ marginBottom: 'var(--space-xl)' }}>
      {/* Search Input Bar Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: 'var(--space-sm)' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          {/* Search Icon */}
          <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>

          {/* Search Input Control */}
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-dark)',
              backgroundColor: 'var(--bg-white)',
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
            aria-label={placeholder}
          />

          {/* Clear Button */}
          {searchQuery && (
            <button
              onClick={onClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClear();
                }
              }}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear Search"
              tabIndex={0}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {/* Filters Toggle Button (Optional) */}
        {showFiltersToggle && (
          <button
            onClick={onFiltersToggle}
            className="btn btn-secondary"
            style={{
              padding: '0 20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: 'var(--radius-sm)'
            }}
            title={showFilters ? "Hide filter configurations" : "Configure filter search criteria"}
            tabIndex={0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            {showFilters ? 'Hide Filters' : 'Filter'}
          </button>
        )}
      </div>

      {/* Inline Loading Indicator */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', marginBottom: '8px' }}>
          <div className="spinner-mini" style={{
            width: '12px',
            height: '12px',
            border: '2px solid var(--accent-navy-light)',
            borderTop: '2px solid var(--accent-navy)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filtering results...</span>
        </div>
      )}

      {/* Collapsible Filters drawer */}
      {showFiltersToggle && showFilters && filtersDrawerContent && (
        <div style={{
          marginBottom: 'var(--space-md)',
          padding: 'var(--space-md)',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)'
        }}>
          {filtersDrawerContent}
        </div>
      )}

      {/* Active Filter Indicators */}
      {activeFiltersContent}

      {/* Result Metrics */}
      {(searchQuery || activeFiltersContent) && !loading && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong>{results.length}</strong> {resultTypeLabel}
          </span>
        </div>
      )}

      {/* Suggestion-Rich Empty State */}
      {!loading && results.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px var(--space-lg)',
          backgroundColor: 'var(--bg-white)',
          border: '1px dashed var(--color-border-dark)',
          borderRadius: 'var(--radius-md)',
          marginTop: 'var(--space-md)'
        }}>
          <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '8px' }}>
            {emptyHeader}
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px' }}>
            {emptyText}
          </p>
          {suggestions.length > 0 && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Suggested terms:
              <div style={{ display: 'inline-flex', gap: '8px', marginLeft: '8px', flexWrap: 'wrap' }}>
                {suggestions.map(term => (
                  <button
                    key={term}
                    onClick={() => onSearchChange(term)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-navy)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                    tabIndex={0}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PortalSearch;
