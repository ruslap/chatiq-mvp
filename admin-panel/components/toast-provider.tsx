"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle2, Info, AlertCircle } from "lucide-react";

type ToastType = "success" | "info" | "error";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case "success":
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case "error":
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getStyles = (type: ToastType) => {
        switch (type) {
            case "success":
                return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50";
            case "error":
                return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50";
            default:
                return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50";
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-in-right ${getStyles(toast.type)}`}
                    >
                        {getIcon(toast.type)}
                        <p className="text-sm font-medium text-[rgb(var(--foreground))] flex-1">
                            {toast.message}
                        </p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-[rgb(var(--foreground-secondary))]" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
