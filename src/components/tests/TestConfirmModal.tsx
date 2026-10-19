import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

interface TestConfirmModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  isProcessing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function TestConfirmModal({
  title, description, confirmLabel, danger = false, isProcessing, onCancel, onConfirm,
}: TestConfirmModalProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isProcessing) onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isProcessing, onCancel]);

  return (
    <div className="test-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isProcessing) onCancel();
    }}>
      <section className="test-modal test-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="test-confirm-title" aria-describedby="test-confirm-description">
        <button type="button" className="test-icon-btn test-confirm-close" aria-label="Закрити" onClick={onCancel} disabled={isProcessing}><X size={18} /></button>
        <div className={`test-confirm-icon ${danger ? "test-confirm-icon--danger" : ""}`}><AlertTriangle size={23} /></div>
        <h2 id="test-confirm-title">{title}</h2>
        <p id="test-confirm-description">{description}</p>
        <footer className="test-modal-footer">
          <button type="button" className="test-btn test-btn--secondary" onClick={onCancel} disabled={isProcessing}>Скасувати</button>
          <button type="button" className={`test-btn ${danger ? "test-btn--danger" : "test-btn--primary"}`} onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? "Зачекайте..." : confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default TestConfirmModal;
