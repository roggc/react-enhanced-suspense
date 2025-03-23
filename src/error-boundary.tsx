"use client";

import { Component, ReactNode } from "react";

type ErrorBoundaryProps = {
  onError?: ((error: Error) => ReactNode) | undefined;
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
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
