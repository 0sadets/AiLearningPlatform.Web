import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  QuestionType,
  type QuestionType as QuestionTypeValue,
} from "../../types/testQuestion";

import {
  createTrueFalseOptions,
  type QuestionDraft,
} from "../../utils/testDraft";

import TestDropdown, {
  type DropdownOption,
} from "./TestDropdown";

interface Props {
  question: QuestionDraft;
  index: number;
  total: number;
  expanded: boolean;
  disabled: boolean;
  onToggle: () => void;
  onChange: (question: QuestionDraft) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}

const typeOptions: DropdownOption<QuestionTypeValue>[] = [
  {
    value: QuestionType.SingleChoice,
    label: "Одна правильна відповідь",
  },
  {
    value: QuestionType.MultipleChoice,
    label: "Декілька правильних відповідей",
  },
  {
    value: QuestionType.TrueFalse,
    label: "Так / Ні",
  },
];

function InlineQuestionEditor({
  question,
  index,
  total,
  expanded,
  disabled,
  onToggle,
  onChange,
  onMove,
  onDelete,
}: Props) {
  const patch = (change: Partial<QuestionDraft>) => {
    onChange({ ...question, ...change });
  };

  function changeType(type: QuestionTypeValue) {
    if (type === question.type) return;

    if (type === QuestionType.TrueFalse) {
      patch({
        type,
        answerOptions: createTrueFalseOptions(),
      });
      return;
    }

    const original =
      question.type === QuestionType.TrueFalse
        ? [
            { key: crypto.randomUUID(), text: "", isCorrect: true },
            { key: crypto.randomUUID(), text: "", isCorrect: false },
          ]
        : question.answerOptions;

    const firstCorrect = Math.max(
      0,
      original.findIndex((item) => item.isCorrect),
    );

    patch({
      type,
      answerOptions:
        type === QuestionType.SingleChoice
          ? original.map((option, i) => ({
              ...option,
              isCorrect: i === firstCorrect,
            }))
          : original,
    });
  }

  function updateOption(
    key: string,
    change: { text?: string; isCorrect?: boolean },
  ) {
    patch({
      answerOptions: question.answerOptions.map((option) =>
        option.key === key ? { ...option, ...change } : option,
      ),
    });
  }

  function selectCorrect(key: string) {
    patch({
      answerOptions: question.answerOptions.map((option) => ({
        ...option,
        isCorrect:
          question.type === QuestionType.MultipleChoice
            ? option.key === key
              ? !option.isCorrect
              : option.isCorrect
            : option.key === key,
      })),
    });
  }

  const typeName =
    typeOptions.find((option) => option.value === question.type)?.label ??
    "Питання";

  return (
    <section
      className={`test-inline-question ${
        expanded ? "test-inline-question--expanded" : ""
      }`}
    >
      <div className="test-inline-question-header">
        <button
          type="button"
          className="test-inline-question-toggle"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <span className="test-inline-question-number">
            {index + 1}
          </span>

        <span className="test-inline-question-caption">
  <strong>
    {question.text.trim() || `Питання ${index + 1}`}
  </strong>

  <small>
    {typeName} · {question.points || 0} бал(ів)
  </small>

  {question.aiSource && (
    <span className="test-question-ai-label">
      <Sparkles size={13} />
      LearnAI · {question.aiSource.materialTitle || "Матеріал курсу"}
    </span>
  )}
</span>

          {expanded ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </button>

        {!disabled && (
          <div className="test-inline-question-actions">
            <button
              type="button"
              aria-label="Перемістити вгору"
              title="Вгору"
              disabled={index === 0}
              onClick={() => onMove(-1)}
            >
              <ArrowUp size={17} />
            </button>

            <button
              type="button"
              aria-label="Перемістити вниз"
              title="Вниз"
              disabled={index === total - 1}
              onClick={() => onMove(1)}
            >
              <ArrowDown size={17} />
            </button>

            <button
              type="button"
              className="test-inline-delete"
              aria-label="Видалити питання"
              title="Видалити"
              onClick={onDelete}
            >
              <Trash2 size={17} />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="test-inline-question-body">
          <label className="test-field">
            <span className="test-field-label">
              Текст питання *
            </span>

            <textarea
              rows={3}
              value={question.text}
              maxLength={2000}
              placeholder="Введіть текст питання..."
              disabled={disabled}
              onChange={(event) =>
                patch({ text: event.target.value })
              }
            />

            <small>{question.text.length}/2000 символів</small>
          </label>

          <div className="test-question-meta-fields">
            <div className="test-field">
              <span className="test-field-label">
                Тип питання
              </span>

              <TestDropdown
                ariaLabel={`Тип питання ${index + 1}`}
                value={question.type}
                options={typeOptions}
                onChange={changeType}
                disabled={disabled}
              />
            </div>

            <label className="test-field">
              <span className="test-field-label">
                Бали *
              </span>

              <input
                type="number"
                min={1}
                step={1}
                value={question.points}
                disabled={disabled}
                onChange={(event) =>
                  patch({ points: event.target.value })
                }
              />
            </label>
          </div>

          <div className="test-inline-options-head">
            <strong>Варіанти відповідей</strong>

            <p>
              {question.type === QuestionType.MultipleChoice
                ? "Позначте принаймні дві правильні відповіді."
                : "Позначте одну правильну відповідь."}
            </p>
          </div>

          <div className="test-inline-options">
            {question.answerOptions.map((option, optionIndex) => (
              <div
                className="test-inline-option"
                key={option.key}
              >
                <input
                  type={
                    question.type === QuestionType.MultipleChoice
                      ? "checkbox"
                      : "radio"
                  }
                  name={`correct-${question.key}`}
                  checked={option.isCorrect}
                  disabled={disabled}
                  aria-label={`Правильна відповідь: варіант ${
                    optionIndex + 1
                  }`}
                  onChange={() => selectCorrect(option.key)}
                />

                <input
                  className="test-option-text-input"
                  value={option.text}
                  maxLength={1000}
                  placeholder={`Варіант ${optionIndex + 1}`}
                  aria-label={`Варіант ${optionIndex + 1}`}
                  disabled={
                    disabled ||
                    question.type === QuestionType.TrueFalse
                  }
                  onChange={(event) =>
                    updateOption(option.key, {
                      text: event.target.value,
                    })
                  }
                />

                {!disabled &&
                  question.type !== QuestionType.TrueFalse && (
                    <button
                      type="button"
                      aria-label={`Видалити варіант ${
                        optionIndex + 1
                      }`}
                      disabled={question.answerOptions.length <= 2}
                      onClick={() =>
                        patch({
                          answerOptions:
                            question.answerOptions.filter(
                              (item) => item.key !== option.key,
                            ),
                        })
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
              </div>
            ))}
          </div>

          {!disabled && question.type !== QuestionType.TrueFalse && (
            <button
              type="button"
              className="test-add-option"
              onClick={() =>
                patch({
                  answerOptions: [
                    ...question.answerOptions,
                    {
                      key: crypto.randomUUID(),
                      text: "",
                      isCorrect: false,
                    },
                  ],
                })
              }
            >
              <Plus size={16} />
              Додати варіант
            </button>
          )}

          {question.aiSource?.excerpt && (
  <div className="test-question-ai-source">
    <strong>Джерело LearnAI</strong>

    <p>{question.aiSource.excerpt}</p>

    <small>
      {question.aiSource.materialTitle}
      {question.aiSource.chunkIndex !== null &&
        ` · Фрагмент ${question.aiSource.chunkIndex}`}
    </small>
  </div>
)}
        </div>
      )}
    </section>
  );
}

export default InlineQuestionEditor;