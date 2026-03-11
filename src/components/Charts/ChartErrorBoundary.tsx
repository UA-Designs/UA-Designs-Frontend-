import React from 'react';

/**
 * Catches Recharts errors (e.g. DecimalError: NaN from getNiceTickValues)
 * so one bad chart does not crash the whole app.
 */
export class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; height?: number },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode; height?: number }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.warn('[ChartErrorBoundary] Chart failed to render:', error.message);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            height: this.props.height ?? 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(26, 26, 26, 0.5)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#8c8c8c',
            fontSize: 13,
          }}
        >
          Chart unavailable
        </div>
      );
    }
    return this.props.children;
  }
}
