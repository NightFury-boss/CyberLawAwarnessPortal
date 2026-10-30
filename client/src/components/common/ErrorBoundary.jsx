import React from 'react';

/**
 * Editorial Error Boundary Component
 * 
 * Prevents catastrophic blank white pages by capturing unhandled React render
 * exceptions and presenting a calm, informative editorial recovery state.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="desk-space page-entry" 
          style={{ 
            padding: 'var(--space-xxl) var(--space-md)', 
            maxWidth: '680px', 
            margin: '0 auto', 
            fontFamily: 'var(--font-sans)',
            textAlign: 'left'
          }}
          role="alert"
        >
          <div 
            style={{ 
              backgroundColor: 'var(--bg-paper, #ffffff)', 
              border: '1px solid var(--border-neutral, #e2e8f0)',
              borderLeft: '4px solid #b91c1c',
              borderRadius: '6px',
              padding: 'var(--space-xl)',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
            }}
          >
            <span 
              style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                color: '#b91c1c',
                marginBottom: '8px'
              }}
            >
              Portal Interface Recovery
            </span>
            <h2 
              style={{ 
                fontSize: '1.35rem', 
                fontWeight: 600, 
                color: 'var(--text-primary, #0f172a)',
                margin: '0 0 12px 0' 
              }}
            >
              Unable to load this workspace view
            </h2>
            <p 
              style={{ 
                color: 'var(--text-secondary, #475569)', 
                fontSize: '0.92rem', 
                lineHeight: 1.6,
                margin: '0 0 20px 0' 
              }}
            >
              An unexpected display issue occurred while preparing your learning view. Your saved progress, assessments, and records remain secure.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.88rem' }}
              >
                Reload Workspace
              </button>
              <a
                href="/"
                className="btn btn-secondary"
                style={{ padding: '8px 18px', fontSize: '0.88rem', textDecoration: 'none' }}
              >
                Return to Public Portal
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
