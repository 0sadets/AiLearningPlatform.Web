import { FileText, Link2, Upload, X } from "lucide-react";

import {
  CourseMaterialType,
  type CourseMaterial,
} from "../../types/courseMaterial";

interface Props {
  isOpen: boolean;
  materials: CourseMaterial[];
  isLoading: boolean;
  isGenerating: boolean;
  selectedIds: number[];
  hasExistingGraph: boolean;
  onToggle: (id: number) => void;
  onClose: () => void;
  onGenerate: () => void;
}

function getMaterialIcon(type: CourseMaterialType) {
  switch (type) {
    case CourseMaterialType.Text:
      return <FileText size={18} />;

    case CourseMaterialType.File:
      return <Upload size={18} />;

    case CourseMaterialType.Link:
      return <Link2 size={18} />;
  }
}

function getMaterialLabel(type: CourseMaterialType) {
  switch (type) {
    case CourseMaterialType.Text:
      return "Текст";

    case CourseMaterialType.File:
      return "Файл";

    case CourseMaterialType.Link:
      return "Посилання";
  }
}

export default function GraphGenerationDialog({
  isOpen,
  materials,
  isLoading,
  isGenerating,
  selectedIds,
  hasExistingGraph,
  onToggle,
  onClose,
  onGenerate,
}: Props) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div
        className="modal-container kg-generation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kg-generate-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="kg-generate-title">
              {hasExistingGraph
                ? "Оновлення графа знань"
                : "Створення графа знань"}
            </h2>

            <p>
              Система проаналізує вибрані матеріали та сформує граф знань. Для
              великих матеріалів буде використано узагальнений режим.
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            disabled={isGenerating}
            aria-label="Закрити"
          >
            <X size={20} />
          </button>
        </div>

        <div className="kg-modal-body">
          <div className="kg-material-selection-header">
            <strong>Навчальні матеріали</strong>

            <span>Обрано {selectedIds.length} із 5</span>
          </div>

          {isLoading ? (
            <p className="kg-details-muted">Завантаження матеріалів...</p>
          ) : materials.length === 0 ? (
            <div className="kg-modal-empty">
              <FileText size={28} />
              <h3>Немає матеріалів</h3>
              <p>Спочатку додайте навчальні матеріали до курсу.</p>
            </div>
          ) : (
            <div className="kg-material-options">
              {materials.map((material) => {
                const checked = selectedIds.includes(material.id);

                const disabled =
                  isGenerating || (!checked && selectedIds.length >= 5);

                return (
                  <label
                    key={material.id}
                    className={[
                      "kg-material-option",
                      checked ? "kg-material-option--selected" : "",
                      disabled && !isGenerating
                        ? "kg-material-option--disabled"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => onToggle(material.id)}
                    />

                    <span className="kg-material-option-icon">
                      {getMaterialIcon(material.type)}
                    </span>

                    <span className="kg-material-option-text">
                      <strong>{material.title}</strong>

                      <small>{getMaterialLabel(material.type)}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {hasExistingGraph && (
            <p className="kg-generation-note">
              Граф буде оновлено. Частина попередніх понять і зв'язків може
              змінитися, а навчальні теми потребуватимуть повторної генерації.
            </p>
          )}

          <p className="kg-generation-note">
            Можна обрати від 1 до 5 навчальних матеріалів. Спосіб аналізу
            система визначить автоматично залежно від їхнього обсягу.
          </p>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={isGenerating}
              onClick={onClose}
            >
              Скасувати
            </button>

            <button
              type="button"
              className="primary-button"
              disabled={
                isLoading ||
                isGenerating ||
                selectedIds.length === 0 ||
                selectedIds.length > 5
              }
              onClick={onGenerate}
            >
              {isGenerating
                ? "Генерація..."
                : hasExistingGraph
                  ? "Оновити граф"
                  : "Створити граф"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
