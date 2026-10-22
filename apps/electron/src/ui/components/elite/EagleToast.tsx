import React, { useState, useEffect, useCallback } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface EagleToastProps extends ToastMessage {
  onClose: (id: string) => void;
}

const colors = {
  success: '#10b981', // Emerald
  error: '#ef4444',   // Red
  warning: '#f59e0b', // Amber
  info: '#06b6d4',    // Cyan (Accent)
};

const bgColors = {
  success: 'rgba(16, 185, 129, 0.15)',
  error: 'rgba(239, 68, 68, 0.15)',
  warning: 'rgba(245, 158, 11, 0.15)',
  info: 'rgba(6, 182, 212, 0.15)',
};

export const EagleToastItem: React.FC<EagleToastProps> = ({
  id,
  message,
  variant = 'info',
  duration = 5000,
  onClose
}) => {
  const [progress, setProgress] = useState(100);
  const color = colors[variant];
  const bgColor = bgColors[variant];

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (elapsed >= duration) {
        clearInterval(interval);
        onClose(id);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [id, duration, onClose]);

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${color}40`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 10px ${color}20`,
        borderRadius: '12px',
        padding: '16px 24px',
        marginBottom: '12px',
        minWidth: '300px',
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
        animation: 'eagleSlideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div style={{ flex: 1, fontSize: '0.95rem' }}>{message}</div>
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.6)',
          cursor: 'pointer',
          padding: '4px',
          transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
      >
        &times;
      </button>
      
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          backgroundColor: color,
          width: `${progress}%`,
          transition: 'width 10ms linear',
        }}
      />
    </div>
  );
};

// Global toast state management for the hook
let toastCounter = 0;
type ToastObserver = (toasts: ToastMessage[]) => void;
let observers: ToastObserver[] = [];
let toasts: ToastMessage[] = [];

const notifyObservers = () => {
  observers.forEach(obs => obs([...toasts]));
};

export const useToast = () => {
  const addToast = useCallback((message: string, variant: ToastVariant = 'info', duration: number = 5000) => {
    const id = `toast-${++toastCounter}`;
    toasts = [...toasts, { id, message, variant, duration }];
    notifyObservers();
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    notifyObservers();
  }, []);

  return { addToast, removeToast };
};

export const EagleToastContainer: React.FC = () => {
  const [currentToasts, setCurrentToasts] = useState<ToastMessage[]>([]);
  const { removeToast } = useToast();

  useEffect(() => {
    const observer = (newToasts: ToastMessage[]) => {
      setCurrentToasts(newToasts);
    };
    observers.push(observer);
    return () => {
      observers = observers.filter(obs => obs !== observer);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      <style>
        {`
          @keyframes eagleSlideInRight {
            from { opacity: 0; transform: translateX(50px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}
      </style>
      {currentToasts.map(toast => (
        <EagleToastItem
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};
