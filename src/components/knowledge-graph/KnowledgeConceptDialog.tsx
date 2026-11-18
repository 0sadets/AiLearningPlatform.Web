import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { BookOpen, X } from "lucide-react";

import type {
  CourseKnowledgeGraphDto,
  CourseKnowledgeTopicsDto,
  CreateKnowledgeConceptDto,
  KnowledgeGraphConceptDto,
} from "../../types/knowledgeGraph";

import { getKnowledgeGraphError } from "../../utils/knowledgeGraph";

interface KnowledgeConceptDialogProps {
  isOpen: boolean;
  concept: KnowledgeGraphConceptDto | null;
  graph: CourseKnowledgeGraphDto;
  topics: CourseKnowledgeTopicsDto | null;
  isBusy: boolean;
  onClose: () => void;
  onSave: (dto: CreateKnowledgeConceptDto) => Promise<void>;
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeForComparison(value: string): string {
  return normalizeSpaces(value).toLocaleUpperCase("uk-UA");
}

export default function KnowledgeConceptDialog({
  isOpen,
  concept,
  graph,
  topics,
  isBusy,
  onClose,
  onSave,
}: KnowledgeConceptDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [selectedTopicIds, setSelectedTopicIds] =
    useState<number[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = concept !== null;

  const activeTopics = useMemo(
    () =>
      [...(topics?.topics ?? [])].sort(
        (a, b) => a.order - b.order,
      ),
    [topics],
  );

  // Скидаємо форму при відкритті
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(concept?.name ?? "");
    setDescription(concept?.description ?? "");
    setSelectedTopicIds([]);
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, concept]);

  const normalizedName = normalizeSpaces(name);

  const normalizedDescription = description.trim();

  // Перевіряємо активні поняття на дублювання назви
  const hasDuplicateName = useMemo(() => {
    const candidate = normalizeForComparison(name);

    if (!candidate) {
      return false;
    }

    return graph.concepts.some(
      (item) =>
        item.id !== concept?.id &&
        normalizeForComparison(item.name) === candidate,
    );
  }, [graph.concepts, concept?.id, name]);

  const validationError = useMemo(() => {
    if (!normalizedName) {
      return "Введіть назву поняття.";
    }

    if (normalizedName.length > 200) {
      return "Назва не може перевищувати 200 символів.";
    }

    if (normalizedDescription.length > 1500) {
      return "Опис не може перевищувати 1500 символів.";
    }

    if (hasDuplicateName) {
      return "Поняття з такою назвою вже існує в графі.";
    }

    if (
      !isEditing &&
      activeTopics.length > 0 &&
      selectedTopicIds.length === 0
    ) {
      return "Виберіть хоча б одну навчальну тему.";
    }

    return null;
  }, [
    normalizedName,
    normalizedDescription,
    hasDuplicateName,
    isEditing,
    activeTopics.length,
    selectedTopicIds.length,
  ]);

  const toggleTopic = (topicId: number) => {
    setSelectedTopicIds((current) =>
      current.includes(topicId)
        ? current.filter((id) => id !== topicId)
        : [...current, topicId],
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (validationError || isSubmitting || isBusy) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSave({
        name: normalizedName,
        description: normalizedDescription || null,
        topicIds: isEditing ? [] : selectedTopicIds,
      });
    } catch (error) {
      setError(
        getKnowledgeGraphError(
          error,
          isEditing
            ? "Не вдалося оновити поняття."
            : "Не вдалося створити поняття.",
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
        className="modal-container kg-concept-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kg-concept-dialog-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="kg-concept-dialog-title">
              {isEditing
                ? "Редагування поняття"
                : "Нове поняття"}
            </h2>

            <p>
              {isEditing
                ? "Змініть назву або опис навчального поняття."
                : "Додайте нове поняття до графа знань курсу."}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            disabled={isSubmitting || isBusy}
            aria-label="Закрити"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="kg-concept-form"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          {/* Назва */}

          <div className="form-group">
            <label htmlFor="kg-concept-name">
              Назва поняття
              <span className="kg-required">*</span>
            </label>

            <input
              id="kg-concept-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              maxLength={200}
              placeholder="Наприклад: Київська Русь"
              disabled={isSubmitting || isBusy}
              autoFocus
            />

            <div className="kg-field-footer">
              <span>
                Коротка та зрозуміла назва навчального
                об'єкта.
              </span>

              <span>{name.length}/200</span>
            </div>

            {hasDuplicateName && (
              <p className="kg-field-error">
                Поняття з такою назвою вже існує.
              </p>
            )}
          </div>

          {/* Опис */}

          <div className="form-group">
            <label htmlFor="kg-concept-description">
              Опис поняття
            </label>

            <textarea
              id="kg-concept-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setError(null);
              }}
              maxLength={1500}
              rows={4}
              placeholder="Коротко поясніть, що означає це поняття..."
              disabled={isSubmitting || isBusy}
            />

            <div className="kg-field-footer">
              <span>Необов'язкове поле</span>
              <span>{description.length}/1500</span>
            </div>
          </div>

          {/* Теми: тільки під час створення */}

          {!isEditing && (
            <div className="kg-concept-topics-field">
              <div className="kg-form-section-header">
                <div>
                  <h3>Навчальні теми</h3>

                  <p>
                    Виберіть теми, до яких належить
                    нове поняття.
                  </p>
                </div>

                {activeTopics.length > 0 && (
                  <span className="kg-selection-counter">
                    {selectedTopicIds.length} обрано
                  </span>
                )}
              </div>

              {activeTopics.length > 0 ? (
                <div className="kg-concept-topic-list">
                  {activeTopics.map((topic) => {
                    const checked =
                      selectedTopicIds.includes(topic.id);

                    return (
                      <label
                        key={topic.id}
                        className={[
                          "kg-concept-topic-option",
                          checked
                            ? "kg-concept-topic-option--checked"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isSubmitting || isBusy}
                          onChange={() =>
                            toggleTopic(topic.id)
                          }
                        />

                        <span className="kg-concept-topic-info">
                          <strong>{topic.name}</strong>

                          {topic.description && (
                            <small>
                              {topic.description}
                            </small>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="kg-concept-no-topics">
                  <BookOpen size={19} />

                  <p>
                    Актуальних навчальних тем поки немає.
                    Поняття можна створити без прив'язки
                    до теми, а потім згенерувати
                    тематичну структуру.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Інформація під час редагування */}

          {isEditing && (
            <div className="kg-concept-edit-note">
              <BookOpen size={17} />

              <p>
                Щоб змінити належність поняття до
                навчальних тем, потрібно відредагувати
                склад відповідної теми.
              </p>
            </div>
          )}

          {/* Помилка сервера */}

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
              onClick={onClose}
              disabled={isSubmitting || isBusy}
            >
              Скасувати
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                validationError !== null ||
                isSubmitting ||
                isBusy
              }
            >
              {isSubmitting
                ? "Збереження..."
                : isEditing
                  ? "Зберегти зміни"
                  : "Додати поняття"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}