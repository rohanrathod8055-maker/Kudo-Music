import { create } from 'zustand';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (message: string, type?: Toast['type'], duration?: number) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],

    addToast: (message, type = 'success', duration = 3000) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

        set((state) => ({
            toasts: [...state.toasts, { id, message, type, duration }],
        }));

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, duration);
        }
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },
}));
