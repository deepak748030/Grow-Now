import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface Toast {
    id: string;
    type: 'success' | 'error';
    message: string;
}

interface ToastContextType {
    addToast: (type: 'success' | 'error', message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: 'success' | 'error', message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { id, type, message };

        setToasts(prev => [...prev, newToast]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 p-4 rounded-lg shadow-lg border min-w-[320px] max-w-md animate-in slide-in-from-right duration-300 ${toast.type === 'success'
                                ? 'bg-green-900/90 border-green-700 text-green-100'
                                : 'bg-red-900/90 border-red-700 text-red-100'
                            }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        )}
                        <p className="flex-1 text-sm font-medium">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};