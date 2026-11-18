import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Pencil,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import type {
  KnowledgeGraphConceptDto,
} from "../../types/knowledgeGraph";

import type {
  AiConceptSuggestionDraft,
} from "../../types/questionKnowledgeConcepts";

interface Props {
  concepts: KnowledgeGraphConceptDto[];
  suggestion: AiConceptSuggestionDraft;
  currentConceptIds: number[];
  disabled: boolean;
  onChange: (ids: number[]) => void;
  onApprovalChange: (approved: boolean) => void;
}

export default function QuestionAiConceptSuggestion({
  concepts,
  suggestion,
  currentConceptIds,
  disabled,
  onChange,
  onApprovalChange,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
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
        concept.name
          .toLocaleLowerCase("uk-UA")
          .includes(query),
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, "uk-UA"),
      );
  }, [concepts, search]);

  const selectedIds = suggestion.selectedConceptIds;
  const noRecommendation =
    suggestion.recommendedConceptIds.length === 0;

  const changeConcept = (id: number) => {
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
    <section className="test-concept-suggestion">
      <div className="test-concept-suggestion-header">
        <span className="test-concept-suggestion-icon">
          <Sparkles size={18} />
        </span>

        <div>
          <h4>Пропозиція LearnAI</h4>
          <p>
            Перевірте відповідності перед збереженням.
          </p>
        </div>

        <span className="test-concept-suggestion-status">
          {suggestion.approved
            ? "Підтверджено"
            : "На перевірці"}
        </span>
      </div>

      {noRecommendation && (
        <p className="test-concept-suggestion-empty">
          Для цього питання не знайдено достатньо
          точних відповідностей у графі знань.
          Ви можете вибрати поняття вручну або
          залишити питання без прив'язки.
        </p>
      )}

      {selectedIds.length > 0 ? (
        <div className="test-concept-suggestion-chips">
          {selectedIds.map((id) => {
            const concept = conceptsById.get(id);

            return (
              <span
                key={id}
                className="test-concept-suggestion-chip"
              >
                {concept?.name ?? "Поняття недоступне"}

                {!disabled && (
                  <button
                    type="button"
                    aria-label={`Прибрати ${
                      concept?.name ?? "поняття"
                    }`}
                    onClick={() => changeConcept(id)}
                  >
                    <X size={13} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="test-concept-suggestion-no-selection">
          Поняття для підтвердження не вибрано.
        </p>
      )}

      {!disabled && (
        <button
          type="button"
          className="test-concept-suggestion-edit"
          aria-expanded={isEditing}
          onClick={() => setIsEditing((current) => !current)}
        >
          <Pencil size={15} />
          {isEditing
            ? "Закрити вибір понять"
            : "Змінити запропоновані поняття"}
          <ChevronDown size={15} />
        </button>
      )}

      {isEditing && !disabled && (
        <div className="test-concept-suggestion-picker">
          <div className="test-concept-suggestion-search">
            <Search size={16} />

            <input
              type="search"
              value={search}
              placeholder="Знайти поняття..."
              aria-label="Пошук понять для AI-пропозиції"
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="test-concept-suggestion-list">
            {filteredConcepts.length === 0 ? (
              <p>За таким запитом понять не знайдено.</p>
            ) : (
              filteredConcepts.map((concept) => {
                const checked = selectedIds.includes(
                  concept.id,
                );

                return (
                  <label
                    key={concept.id}
                    className="test-concept-suggestion-option"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        changeConcept(concept.id)
                      }
                    />

                    <span>{concept.name}</span>

                    {checked && (
                      <Check size={15} />
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}

      {selectedIds.length === 0 &&
        currentConceptIds.length > 0 && (
          <p className="test-concept-suggestion-warning">
            У цього питання вже є збережені прив'язки.
            Якщо підтвердити порожній список, їх буде
            видалено.
          </p>
        )}

      <label className="test-concept-suggestion-approve">
        <input
          type="checkbox"
          checked={suggestion.approved}
          disabled={disabled}
          onChange={(event) =>
            onApprovalChange(event.target.checked)
          }
        />

        <span>
          Підтвердити вибір для цього питання
        </span>
      </label>
    </section>
  );
}