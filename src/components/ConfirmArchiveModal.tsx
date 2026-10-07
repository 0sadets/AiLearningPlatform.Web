interface ConfirmArchiveModalProps {
  isOpen: boolean
  isArchiving: boolean
  onCancel: () => void
  onConfirm: () => void
}

function ConfirmArchiveModal({
  isOpen,
  isArchiving,
  onCancel,
  onConfirm,
}: ConfirmArchiveModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={onCancel}
    >
      <div
        className="confirm-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <h2>Архівувати курс?</h2>

        <p>
          Курс більше не буде активним, але всі його дані
          залишаться збереженими. Надалі курс можна буде
          відновити.
        </p>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={isArchiving}
          >
            Скасувати
          </button>

          <button
            type="button"
            className="archive-confirm-button"
            onClick={onConfirm}
            disabled={isArchiving}
          >
            {isArchiving
              ? 'Архівування...'
              : 'Архівувати'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmArchiveModal