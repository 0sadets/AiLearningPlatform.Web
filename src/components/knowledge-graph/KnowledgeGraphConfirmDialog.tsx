import type { ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

interface KnowledgeGraphConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isProcessing: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function KnowledgeGraphConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Видалити",
  isProcessing,
  confirmDisabled = false,
  children,
  onCancel,
  onConfirm,
}: KnowledgeGraphConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div
        className="modal-container kg-delete-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="kg-delete-dialog-title"
        aria-describedby="kg-delete-dialog-description"
      >
        <div className="kg-delete-dialog-header">
          <div className="kg-delete-warning-icon">
            <AlertTriangle size={23} />
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onCancel}
            disabled={isProcessing}
            aria-label="Закрити"
          >
            <X size={20} />
          </button>
        </div>

        <div className="kg-delete-dialog-content">
          <h2 id="kg-delete-dialog-title">{title}</h2>

          <p id="kg-delete-dialog-description">{description}</p>

          {children}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={isProcessing}
              onClick={onCancel}
            >
              Скасувати
            </button>

            <button
              type="button"
              className="kg-danger-button"
              disabled={isProcessing || confirmDisabled}
              onClick={onConfirm}
            >
              {isProcessing ? "Видалення..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
