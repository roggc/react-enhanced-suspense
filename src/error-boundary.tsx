"use client";

import { Component, ReactNode } from "react";

type ErrorBoundaryProps = {
  onError: (error: Error) => ReactNode;
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
      return this.props.onError(this.state.error);
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
