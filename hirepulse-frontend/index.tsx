import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * A robust Error Boundary component to catch runtime errors in its child component tree,
 * log those errors, and display a fallback UI instead of the crashed component tree.
 * This is crucial for a production-grade application to prevent a white screen of death.
 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  props: { children: React.ReactNode };
  state: { hasError: boolean };

  // FIX: Replaced the direct state initialization with a constructor. The class property syntax can sometimes cause issues with how `this.props` is handled depending on the TypeScript configuration, leading to the reported error. The constructor ensures `super(props)` is called correctly and the component is initialized properly.
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In a real application, you would log this to an error reporting service
    // like Sentry, LogRocket, etc.
    console.error("Caught an application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // A clean, styled fallback UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'Inter, sans-serif',
          backgroundColor: '#f8fafc', // bg-slate-50
          color: '#475569', // text-slate-600
          padding: '2rem'
        }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '900', color: '#1e293b' }}>Application Error</h1>
          <p style={{ marginTop: '0.5rem', fontSize: '1rem', maxWidth: '400px', textAlign: 'center' }}>
            A critical error occurred that prevented the application from loading. We have been notified of the issue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#1e1b4b', // bg-indigo-950
              border: 'none',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Application Mounting Logic ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to. Ensure an element with id='root' exists in your index.html.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
