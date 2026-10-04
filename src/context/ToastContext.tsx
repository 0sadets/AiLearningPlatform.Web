import {
  createContext,
  useContext,
  useRef,
  useState,
} from 'react'

import '../styles/toast.css'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastType,
  ) => void
}

const ToastContext = createContext<
  ToastContextType | undefined
>(undefined)

export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] =
    useState<Toast[]>([])

  const nextId = useRef(1)

  const removeToast = (id: number) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id),
    )
  }

  const showToast = (
    message: string,
    type: ToastType = 'success',
  ) => {
    const id = nextId.current++

    setToasts((current) => [
      ...current,
      {
        id,
        message,
        type,
      },
    ])

    window.setTimeout(() => {
      removeToast(id)
    }, 4000)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
          >
            <div className="toast-message">
              {toast.message}
            </div>

            <button
              type="button"
              className="toast-close"
              onClick={() =>
                removeToast(toast.id)
              }
              aria-label="Закрити повідомлення"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error(
      'useToast must be used inside ToastProvider',
    )
  }

  return context
}