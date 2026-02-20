import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    sectionName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class SectionErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in section:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const sectionName = this.props.sectionName || 'esta seção';

            return (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-center my-4 animate-in fade-in">
                    <div className="flex justify-center mb-2">
                        <AlertTriangle className="text-red-500" size={24} />
                    </div>
                    <h3 className="text-sm font-semibold text-red-800 mb-1">
                        Ops! Algo deu errado n{sectionName === 'esta seção' ? 'esta seção' : `o ${sectionName}`}.
                    </h3>
                    <p className="text-xs text-red-600 mb-3">
                        Não foi possível carregar o conteúdo.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                        <RefreshCw size={12} className="mr-1.5" />
                        Tentar Novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default SectionErrorBoundary;
