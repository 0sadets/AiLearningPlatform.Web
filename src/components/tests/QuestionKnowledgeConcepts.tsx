import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Network, Search, X } from "lucide-react";

import type {
  KnowledgeGraphConceptDto,
} from "../../types/knowledgeGraph";

export type KnowledgeConceptsLoadStatus =
  | "loading"
  | "ready"
  | "missing"
  | "error";

interface Props {
  courseId: number;
  concepts: KnowledgeGraphConceptDto[];
  status: KnowledgeConceptsLoadStatus;
  selectedIds: number[];
  disabled: boolean;
  onChange: (ids: number[]) => void;
}

export default function QuestionKnowledgeConcepts({
  courseId,
  concepts,
  status,
  selectedIds,
  disabled,
  onChange,
}: Props) {
  const [search, setSearch] = useState("");

  const conceptsById = useMemo(
    () => new Map(concepts.map((concept) => [
      concept.id,
      concept,
    ])),
    [concepts],
  );

  const filteredConcepts = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("uk-UA");

    return [...concepts]
      .filter((concept) =>
        concept.name.toLocaleLowerCase("uk-UA").includes(query),
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, "uk-UA"),
      );
  }, [concepts, search]);

  const hasUnavailableConcepts =
    status === "ready" &&
    selectedIds.some((id) => !conceptsById.has(id));

  const toggleConcept = (id: number) => {
    if (disabled) {
      return;
    }

    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id],
    );
  };

  return (
    <section className="test-knowledge-field">
      <div className="test-knowledge-heading">
        <span className="test-knowledge-icon">
          <Network size={18} />
        </span>

        <div>
          <h4>Зв'язок із графом знань</h4>
          <p>
            Оберіть поняття, знання яких перевіряє
            це питання. Це необов'язково.
          </p>
        </div>

        <span className="test-knowledge-count">
          {selectedIds.length} обрано
        </span>
      </div>

      {selectedIds.length > 0 && (
        <div className="test-knowledge-selected">
          {selectedIds.map((id) => {
            const concept = conceptsById.get(id);

            return (
              <span
                key={id}
                className={`test-knowledge-chip ${
                  !concept && status === "ready"
                    ? "test-knowledge-chip--missing"
                    : ""
                }`}
              >
                <span>
                  {concept?.name ??
                    (status === "loading"
                      ? "Завантаження поняття..."
                      : "Поняття недоступне")}
                </span>

                {!disabled && (
                  <button
                    type="button"
                    aria-label={`Прибрати ${
                      concept?.name ?? "недоступне поняття"
                    }`}
                    onClick={() => toggleConcept(id)}
                  >
                    <X size={13} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {hasUnavailableConcepts && !disabled && (
        <p className="test-knowledge-warning">
          Деякі раніше вибрані поняття більше недоступні.
          Приберіть їх перед збереженням тесту.
        </p>
      )}

      {status === "loading" && (
        <p className="test-knowledge-message">
          Завантажуємо поняття курсу...
        </p>
      )}

      {status === "error" && (
        <p className="test-knowledge-message">
          Не вдалося завантажити поняття графа знань.
          Оновіть сторінку, щоб повторити спробу.
        </p>
      )}

      {status === "missing" && (
        <div className="test-knowledge-empty">
          <p>
            Для вибору понять спочатку створіть
            граф знань курсу.
          </p>

          {courseId > 0 && (
            <Link
              to={`/courses/${courseId}/knowledge-graph`}
            >
              Перейти до графа знань
            </Link>
          )}
        </div>
      )}

      {status === "ready" && concepts.length === 0 && (
        <div className="test-knowledge-empty">
          <p>
            Граф знань поки не містить понять,
            які можна вибрати для цього питання.
          </p>
        </div>
      )}

     {status === "ready" && concepts.length > 0 && !disabled && (
        <>
          <div className="test-knowledge-search">
            <Search size={17} />

            <input
              type="search"
              value={search}
              placeholder="Пошук навчального поняття..."
              aria-label="Пошук понять графа знань"
              disabled={disabled}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="test-knowledge-list">
            {filteredConcepts.length === 0 ? (
              <p className="test-knowledge-no-results">
                Понять за таким запитом не знайдено.
              </p>
            ) : (
              filteredConcepts.map((concept) => {
                const checked = selectedIds.includes(
                  concept.id,
                );

                return (
                  <label
                    key={concept.id}
                    className={`test-knowledge-option ${
                      checked
                        ? "test-knowledge-option--selected"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() =>
                        toggleConcept(concept.id)
                      }
                    />

                    <span className="test-knowledge-option-info">
                      <strong>{concept.name}</strong>

                      {concept.description && (
                        <small>
                          {concept.description}
                        </small>
                      )}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </>
      )}
    </section>
  );
}