import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-4">
          <div className="h-16 w-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center shadow-xs">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Something went wrong
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              We encountered an unexpected display error loading this section.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleReset}
              className="rounded-xl font-bold text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Refresh Page
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={this.handleGoHome}
              className="bg-[#8B1E3F] hover:bg-[#721733] text-white rounded-xl font-bold text-xs"
            >
              <Home className="h-3.5 w-3.5 mr-1" /> Back to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
