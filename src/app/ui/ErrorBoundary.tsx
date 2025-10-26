import { Component, type ReactNode, type ErrorInfo } from 'react';

import { ConsoleLogger, type ILogger } from '@/shared/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  info?: ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  console: ILogger = new ConsoleLogger();

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
    if (this.props.onError) this.props.onError(error, info);
    else this.console.error(`${error.message} ${info.componentStack}`);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h2>Что-то пошло не так 😞</h2>
          {import.meta.env.DEV && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.error?.toString()}
              <br />
              {this.state.info?.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
