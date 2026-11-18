import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { Info, Search, X } from "lucide-react";

import type {
  CourseKnowledgeGraphDto,
  CourseKnowledgeTopicsDto,
  CreateKnowledgeTopicDto,
  KnowledgeTopicDto,
} from "../../types/knowledgeGraph";

import { getKnowledgeGraphError } from "../../utils/knowledgeGraph";

interface Props {
  isOpen: boolean;
  graph: CourseKnowledgeGraphDto;
  topics: CourseKnowledgeTopicsDto;
  topic: KnowledgeTopicDto | null;
  isBusy: boolean;
  onClose: () => void;
  onSave: (dto: CreateKnowledgeTopicDto) => Promise<void>;
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export default function KnowledgeTopicDialog({
  isOpen,
  graph,
  topics,
  topic,
  isBusy,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(1);
  const [selectedConceptIds, setSelectedConceptIds] =
    useState<number[]>([]);

  const [conceptSearch, setConceptSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = topic !== null;

  const concepts = useMemo(
    () =>
      [...graph.concepts].sort((a, b) =>
        a.name.localeCompare(b.name, "uk-UA"),
      ),
    [graph.concepts],
  );

  const requiredConceptIds = useMemo(() => {
    if (!topic) {
      return new Set<number>();
    }

    const coveredByOtherTopics = new Set(
      topics.topics
        .filter((item) => item.id !== topic.id)
        .flatMap((item) => item.conceptIds),
    );

    return new Set(
      topic.conceptIds.filter(
        (id) => !coveredByOtherTopics.has(id),
      ),
    );
  }, [topic, topics]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(topic?.name ?? "");
    setDescription(topic?.description ?? "");
    setOrder(topic?.order ?? topics.topics.length + 1);
    setSelectedConceptIds(topic?.conceptIds ?? []);
    setConceptSearch("");
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, topic, topics.topics.length]);

  const filteredConcepts = useMemo(() => {
    const query = conceptSearch
      .trim()
      .toLocaleLowerCase("uk-UA");

    if (!query) {
      return concepts;
    }

    return concepts.filter((concept) =>
      concept.name.toLocaleLowerCase("uk-UA").includes(query),
    );
  }, [concepts, conceptSearch]);

  const normalizedName = normalizeName(name);
  const normalizedDescription = description.trim();

  const hasDuplicateName = useMemo(() => {
    if (!normalizedName) {
      return false;
    }

    const candidate = normalizedName.toLocaleUpperCase("uk-UA");

    return topics.topics.some(
      (item) =>
        item.id !== topic?.id &&
        normalizeName(item.name).toLocaleUpperCase("uk-UA") ===
          candidate,
    );
  }, [normalizedName, topics.topics, topic?.id]);

  const maxOrder = topics.topics.length + (isEditing ? 0 : 1);

  const validationError = useMemo(() => {
    if (!topics.isCurrent) {
      return "Спочатку актуалізуйте навчальні теми.";
    }

    if (!normalizedName) {
      return "Введіть назву навчальної теми.";
    }

    if (normalizedName.length > 200) {
      return "Назва не може перевищувати 200 символів.";
    }

    if (normalizedDescription.length > 1500) {
      return "Опис не може перевищувати 1500 символів.";
    }

    if (hasDuplicateName) {
      return "Навчальна тема з такою назвою вже існує.";
    }

    if (
      !Number.isInteger(order) ||
      order < 1 ||
      order > maxOrder
    ) {
      return "Оберіть коректний порядок теми.";
    }

    if (selectedConceptIds.length === 0) {
      return "Виберіть хоча б одне поняття.";
    }

    if (
      [...requiredConceptIds].some(
        (id) => !selectedConceptIds.includes(id),
      )
    ) {
      return "Не можна залишити поняття без навчальної теми.";
    }

    return null;
  }, [
    topics.isCurrent,
    normalizedName,
    normalizedDescription,
    hasDuplicateName,
    order,
    maxOrder,
    selectedConceptIds,
    requiredConceptIds,
  ]);

  const toggleConcept = (conceptId: number) => {
    if (requiredConceptIds.has(conceptId)) {
      return;
    }

    setSelectedConceptIds((current) =>
      current.includes(conceptId)
        ? current.filter((id) => id !== conceptId)
        : [...current, conceptId],
    );

    setError(null);
  };

  const hasChanges =
  !topic ||
  normalizedName !== normalizeName(topic.name) ||
  normalizedDescription !== (topic.description?.trim() ?? "") ||
  order !== topic.order ||
  selectedConceptIds.length !== topic.conceptIds.length ||
  selectedConceptIds.some(
    (id) => !topic.conceptIds.includes(id),
  );


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

   if (validationError || !hasChanges || isSubmitting || isBusy) {
  return;
}

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: normalizedName,
        description: normalizedDescription || null,
        order,
        conceptIds: selectedConceptIds,
      });
    } catch (error) {
      setError(
        getKnowledgeGraphError(
          error,
          isEditing
            ? "Не вдалося оновити навчальну тему."
            : "Не вдалося створити навчальну тему.",
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
        className="modal-container kg-topic-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kg-topic-dialog-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="kg-topic-dialog-title">
              {isEditing
                ? "Редагування навчальної теми"
                : "Нова навчальна тема"}
            </h2>

            <p>
              {isEditing
                ? "Змініть назву, опис, порядок або склад понять теми."
                : "Створіть тематичну групу для понять графа знань."}
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
          className="kg-topic-form"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          <div className="form-group">
            <label htmlFor="kg-topic-name">
              Назва теми
              <span className="kg-required">*</span>
            </label>

            <input
              id="kg-topic-name"
              type="text"
              value={name}
              maxLength={200}
              autoFocus
              disabled={isSubmitting || isBusy}
              placeholder="Наприклад: Князівська влада"
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
            />

            <div className="kg-field-footer">
              <span>Назва навчальної теми</span>
              <span>{name.length}/200</span>
            </div>

            {hasDuplicateName && (
              <p className="kg-field-error">
                Тема з такою назвою вже існує.
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="kg-topic-description">
              Опис теми
            </label>

            <textarea
              id="kg-topic-description"
              value={description}
              maxLength={1500}
              rows={3}
              disabled={isSubmitting || isBusy}
              placeholder="Коротко опишіть, що вивчається в цій темі..."
              onChange={(event) => {
                setDescription(event.target.value);
                setError(null);
              }}
            />

            <div className="kg-field-footer">
              <span>Необов'язкове поле</span>
              <span>{description.length}/1500</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="kg-topic-order">
              Порядок відображення
              <span className="kg-required">*</span>
            </label>

            <select
              id="kg-topic-order"
              value={order}
              disabled={isSubmitting || isBusy}
              onChange={(event) =>
                setOrder(Number(event.target.value))
              }
            >
              {Array.from(
                { length: maxOrder },
                (_, index) => index + 1,
              ).map((position) => (
                <option key={position} value={position}>
                  {position === 1
                    ? "1 — Перша тема"
                    : `${position} — Позиція ${position}`}
                </option>
              ))}
            </select>

            <p className="kg-topic-field-hint">
              Якщо змінити порядок теми, система
              автоматично перенумерує інші теми.
            </p>
          </div>

          <div className="kg-topic-concept-section">
            <div className="kg-form-section-header">
              <div>
                <h3>
                  Ключові поняття
                  <span className="kg-required">*</span>
                </h3>

                <p>
                  Виберіть поняття, які охоплює
                  ця навчальна тема.
                </p>
              </div>

              <span className="kg-selection-counter">
                {selectedConceptIds.length} обрано
              </span>
            </div>

            <div className="kg-topic-search">
              <Search size={17} />

              <input
                type="search"
                value={conceptSearch}
                placeholder="Знайти поняття..."
                disabled={isSubmitting || isBusy}
                onChange={(event) =>
                  setConceptSearch(event.target.value)
                }
              />
            </div>

            <div className="kg-topic-concept-list">
              {filteredConcepts.length === 0 ? (
                <div className="kg-topic-no-results">
                  Понять за таким запитом не знайдено.
                </div>
              ) : (
                filteredConcepts.map((concept) => {
                  const checked =
                    selectedConceptIds.includes(concept.id);

                  const required =
                    requiredConceptIds.has(concept.id);

                  return (
                    <label
                      key={concept.id}
                      className={[
                        "kg-topic-concept-option",
                        checked
                          ? "kg-topic-concept-option--checked"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={
                          isSubmitting || isBusy || required
                        }
                        onChange={() =>
                          toggleConcept(concept.id)
                        }
                      />

                      <span className="kg-topic-concept-info">
                        <strong>{concept.name}</strong>

                        {required ? (
                          <small className="kg-topic-required-label">
                            Єдина тема для цього поняття
                          </small>
                        ) : concept.description ? (
                          <small>{concept.description}</small>
                        ) : null}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            {isEditing && requiredConceptIds.size > 0 && (
              <div className="kg-topic-coverage-note">
                <Info size={17} />

                <p>
                  Поняття, які належать лише цій темі,
                  не можна вилучити. Спочатку додайте
                  їх до іншої навчальної теми.
                </p>
              </div>
            )}
          </div>

          {selectedConceptIds.length === 0 && (
            <p className="kg-field-error">
              Виберіть хоча б одне поняття.
            </p>
          )}

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

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
                  : "Створити тему"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}