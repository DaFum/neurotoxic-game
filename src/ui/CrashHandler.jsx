import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReboot = () => {
      this.setState({ hasError: false, error: null, errorInfo: null });
      window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-black text-red-600 p-8 z-[9999] relative">
            <h1 className="text-6xl font-[Metal_Mania] mb-4">SYSTEM FAILURE</h1>
            <p className="text-[var(--toxic-green)] font-mono mb-8">The simulation has crashed. Reboot required.</p>
            
            <div className="bg-red-900/20 border border-red-600 p-4 rounded mb-8 w-full max-w-2xl overflow-auto max-h-64 text-xs font-mono">
                <p className="font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
                <pre className="whitespace-pre-wrap">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </div>

            <button 
                onClick={this.handleReboot}
                className="px-6 py-2 border-2 border-red-600 text-white font-[Metal_Mania] hover:bg-red-600 hover:text-black transition-colors"
            >
                REBOOT SYSTEM
            </button>
        </div>
      );
    }

    return this.props.children; 
  }
}
