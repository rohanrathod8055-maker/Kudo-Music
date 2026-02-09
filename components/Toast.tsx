'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore, Toast } from '@/store/useToastStore';

export function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    return (
        <div style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '400px',
            width: '100%',
            pointerEvents: 'none',
        }}>
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleDismiss = () => {
        setIsLeaving(true);
        setTimeout(onDismiss, 200);
    };

    const icons = {
        success: <CheckCircle size={20} />,
        error: <AlertCircle size={20} />,
        warning: <AlertTriangle size={20} />,
        info: <Info size={20} />,
    };

    const colors = {
        success: {
            bg: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
            icon: '#fff',
            text: '#fff',
        },
        error: {
            bg: 'linear-gradient(135deg, #e91429 0%, #ff6b6b 100%)',
            icon: '#fff',
            text: '#fff',
        },
        warning: {
            bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            icon: '#000',
            text: '#000',
        },
        info: {
            bg: 'linear-gradient(135deg, #7B2CBF 0%, #E040FB 100%)',
            icon: '#fff',
            text: '#fff',
        },
    };

    const style = colors[toast.type];

    return (
        <div
            style={{
                background: style.bg,
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                transform: isLeaving
                    ? 'translateX(120%)'
                    : isVisible
                        ? 'translateX(0)'
                        : 'translateX(120%)',
                opacity: isLeaving ? 0 : 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: 'auto',
                backdropFilter: 'blur(10px)',
            }}
        >
            <div style={{ color: style.icon, flexShrink: 0 }}>
                {icons[toast.type]}
            </div>
            <p style={{
                color: style.text,
                fontSize: '14px',
                fontWeight: 500,
                margin: 0,
                flex: 1,
            }}>
                {toast.message}
            </p>
            <button
                onClick={handleDismiss}
                style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: style.icon,
                    flexShrink: 0,
                    transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
                <X size={14} />
            </button>
        </div>
    );
}

// Helper hook for easy toast usage
export function useToast() {
    const { addToast } = useToastStore();

    return {
        success: (message: string, duration?: number) => addToast(message, 'success', duration),
        error: (message: string, duration?: number) => addToast(message, 'error', duration),
        warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
        info: (message: string, duration?: number) => addToast(message, 'info', duration),
    };
}
