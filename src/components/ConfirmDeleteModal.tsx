interface ConfirmDeleteModalProps {
  isOpen: boolean
  title: string
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

function ConfirmDeleteModal({
  isOpen,
  title,
  isDeleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
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
        <h2>Видалити матеріал?</h2>

        <p>
          Матеріал <strong>«{title}»</strong> буде
          видалено без можливості відновлення.
        </p>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Скасувати
          </button>

          <button
            type="button"
            className="danger-button"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting
              ? 'Видалення...'
              : 'Видалити'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal