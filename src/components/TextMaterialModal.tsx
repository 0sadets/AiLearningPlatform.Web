import type { CourseMaterial } from '../types/courseMaterial'

import '../styles/material-modal.css'

interface TextMaterialModalProps {
  material: CourseMaterial | null
  onClose: () => void
}

function TextMaterialModal({
  material,
  onClose,
}: TextMaterialModalProps) {
  if (!material) {
    return null
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="text-material-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <span className="text-material-label">
              Текстовий матеріал
            </span>

            <h2>{material.title}</h2>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Закрити"
          >
            ×
          </button>
        </div>

        <div className="text-material-content">
          {material.textContent ? (
            <p>{material.textContent}</p>
          ) : (
            <p className="text-material-empty">
              Матеріал не містить тексту.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TextMaterialModal