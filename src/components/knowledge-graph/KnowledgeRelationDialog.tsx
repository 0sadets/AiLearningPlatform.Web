import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  ArrowLeftRight,
  GitBranch,
  Info,
  X,
} from "lucide-react";

import {
  KnowledgeRelationType,
  type CourseKnowledgeGraphDto,
  type CreateKnowledgeRelationDto,
  type KnowledgeGraphRelationDto,
} from "../../types/knowledgeGraph";

import { RELATION_INFO, getKnowledgeGraphError } from "../../utils/knowledgeGraph";

import { validateKnowledgeRelation } from "../../utils/knowledgeRelationValidation";

interface Props {
  isOpen: boolean;
  graph: CourseKnowledgeGraphDto;
  relation: KnowledgeGraphRelationDto | null;
  isBusy: boolean;
  onClose: () => void;
  onSave: (dto: CreateKnowledgeRelationDto) => Promise<void>;
}

export default function KnowledgeRelationDialog({
  isOpen,
  graph,
  relation,
  isBusy,
  onClose,
  onSave,
}: Props) {
  const [sourceConceptId, setSourceConceptId] =
    useState(0);

  const [targetConceptId, setTargetConceptId] =
    useState(0);

  const [type, setType] = useState<KnowledgeRelationType>(
    KnowledgeRelationType.RelatedTo,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = relation !== null;

  const concepts = useMemo(
    () =>
      [...graph.concepts].sort((a, b) =>
        a.name.localeCompare(b.name, "uk-UA"),
      ),
    [graph.concepts],
  );

  // Заповнюємо поля при відкритті форми
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (relation) {
      setSourceConceptId(relation.sourceConceptId);
      setTargetConceptId(relation.targetConceptId);
      setType(relation.type);
    } else {
      const firstConceptId = graph.concepts[0]?.id ?? 0;

      const secondConceptId =
        graph.concepts.find(
          (concept) => concept.id !== firstConceptId,
        )?.id ?? 0;

      setSourceConceptId(firstConceptId);
      setTargetConceptId(secondConceptId);
      setType(KnowledgeRelationType.RelatedTo);
    }

    setIsSubmitting(false);
    setError(null);
  }, [isOpen, relation, graph.concepts]);

  const dto: CreateKnowledgeRelationDto = {
    sourceConceptId,
    targetConceptId,
    type,
  };

  const validationError = useMemo(
    () =>
      validateKnowledgeRelation(
        graph,
        {
          sourceConceptId,
          targetConceptId,
          type,
        },
        relation?.id,
      ),
    [
      graph,
      sourceConceptId,
      targetConceptId,
      type,
      relation?.id,
    ],
  );

  const hasChanges =
    !relation ||
    relation.sourceConceptId !== sourceConceptId ||
    relation.targetConceptId !== targetConceptId ||
    relation.type !== type;

  const sourceConcept = graph.concepts.find(
    (concept) => concept.id === sourceConceptId,
  );

  const targetConcept = graph.concepts.find(
    (concept) => concept.id === targetConceptId,
  );

  const relationInfo = RELATION_INFO[type];

  const swapConcepts = () => {
    if (isSubmitting || isBusy) {
      return;
    }

    setSourceConceptId(targetConceptId);
    setTargetConceptId(sourceConceptId);
    setError(null);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      validationError ||
      !hasChanges ||
      isSubmitting ||
      isBusy
    ) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(dto);
    } catch (error) {
      setError(
        getKnowledgeGraphError(
          error,
          isEditing
            ? "Не вдалося оновити семантичний зв'язок."
            : "Не вдалося створити семантичний зв'язок.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div
        className="modal-container kg-relation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kg-relation-dialog-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="kg-relation-dialog-title">
              {isEditing
                ? "Редагування зв'язку"
                : "Новий семантичний зв'язок"}
            </h2>

            <p>
              {isEditing
                ? "Змініть поняття або тип семантичного відношення."
                : "Визначте, як два навчальні поняття пов'язані між собою."}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            disabled={isSubmitting || isBusy}
            onClick={onClose}
            aria-label="Закрити"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="kg-relation-form"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          {/* Вихідне поняття */}

          <div className="form-group">
            <label htmlFor="kg-relation-source">
              Вихідне поняття
              <span className="kg-required">*</span>
            </label>

            <select
              id="kg-relation-source"
              value={sourceConceptId}
              disabled={isSubmitting || isBusy}
              onChange={(event) => {
                setSourceConceptId(
                  Number(event.target.value),
                );
                setError(null);
              }}
            >
              <option value={0} disabled>
                Оберіть поняття
              </option>

              {concepts.map((concept) => (
                <option
                  key={concept.id}
                  value={concept.id}
                >
                  {concept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Переставити поняття місцями */}

          <div className="kg-relation-swap-row">
            <button
              type="button"
              className="kg-relation-swap-button"
              disabled={isSubmitting || isBusy}
              onClick={swapConcepts}
              title="Поміняти поняття місцями"
            >
              <ArrowLeftRight size={15} />
              Поміняти місцями
            </button>
          </div>

          {/* Цільове поняття */}

          <div className="form-group">
            <label htmlFor="kg-relation-target">
              Цільове поняття
              <span className="kg-required">*</span>
            </label>

            <select
              id="kg-relation-target"
              value={targetConceptId}
              disabled={isSubmitting || isBusy}
              onChange={(event) => {
                setTargetConceptId(
                  Number(event.target.value),
                );
                setError(null);
              }}
            >
              <option value={0} disabled>
                Оберіть поняття
              </option>

              {concepts.map((concept) => (
                <option
                  key={concept.id}
                  value={concept.id}
                >
                  {concept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Тип зв'язку */}

          <div className="form-group">
            <label htmlFor="kg-relation-type">
              Тип семантичного зв'язку
              <span className="kg-required">*</span>
            </label>

            <select
              id="kg-relation-type"
              value={type}
              disabled={isSubmitting || isBusy}
              onChange={(event) => {
                setType(
                  Number(event.target.value) as KnowledgeRelationType,
                );
                setError(null);
              }}
            >
              {Object.values(KnowledgeRelationType).map(
                (relationType) => (
                  <option
                    key={relationType}
                    value={relationType}
                  >
                    {RELATION_INFO[relationType].label}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Пояснення та напрямок */}

          <div className="kg-relation-explanation">
            <div className="kg-relation-explanation-heading">
              <GitBranch
                size={17}
                color={relationInfo.color}
              />

              <strong>
                {relationInfo.label}
              </strong>
            </div>

            <p>{relationInfo.description}</p>

            <div className="kg-relation-preview">
              <span>
                {sourceConcept?.name ?? "Вихідне поняття"}
              </span>

              <strong>
                {type === KnowledgeRelationType.RelatedTo
                  ? "↔"
                  : "→"}
              </strong>

              <span>
                {targetConcept?.name ?? "Цільове поняття"}
              </span>
            </div>
          </div>

          {/* Попередня валідація */}

          {validationError && (
            <div
              className="kg-relation-validation"
              role="alert"
            >
              <Info size={17} />
              <p>{validationError}</p>
            </div>
          )}

          {/* Попередження під час редагування */}

          {isEditing && (
            <div className="kg-relation-edit-note">
              <Info size={17} />

              <p>
                Якщо змінити поняття або тип зв'язку,
                збережені підтверджувальні цитати цього
                відношення будуть видалені. Після
                збереження зв'язок буде позначений як
                відредагований вручну.
              </p>
            </div>
          )}

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          {/* Кнопки */}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={isSubmitting || isBusy}
              onClick={onClose}
            >
              Скасувати
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                isSubmitting ||
                isBusy ||
                validationError !== null ||
                !hasChanges
              }
            >
              {isSubmitting
                ? "Збереження..."
                : isEditing
                  ? "Зберегти зміни"
                  : "Додати зв'язок"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}