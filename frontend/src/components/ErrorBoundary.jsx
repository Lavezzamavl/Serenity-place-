import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-mist px-4">
          <div className="max-w-sm text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="font-display text-lg font-semibold text-harbor mb-2">Something went wrong</h2>
            <p className="text-sm text-slate mb-4">
              This screen hit an unexpected error. Try reloading — if it persists, the backend may be unreachable.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-serenity text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-harbor transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}