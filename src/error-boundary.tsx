import React, { Component, ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | undefined;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: ((error: Error) => ReactNode) | undefined;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.onError ? (
        this.props.onError(this.state.error)
      ) : (
        <div>
          <h2>Ups</h2>
          <p>{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
