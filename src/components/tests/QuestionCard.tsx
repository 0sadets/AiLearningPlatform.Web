import { ArrowDown, ArrowUp, Check, Pencil, Trash2 } from "lucide-react";
import { QuestionType, type QuestionDto } from "../../types/testQuestion";

interface QuestionCardProps {
  question: QuestionDto;
  index: number;
  count: number;
  locked: boolean;
  disabled: boolean;
  onMove: (id: number, direction: -1 | 1) => void;
  onEdit: (question: QuestionDto) => void;
  onDelete: (question: QuestionDto) => void;
}

function getTypeName(type: number): string {
  switch (type) {
    case QuestionType.SingleChoice:
      return "Одна відповідь";
    case QuestionType.MultipleChoice:
      return "Декілька відповідей";
    case QuestionType.TrueFalse:
      return "Так / Ні";
    default:
      return "Питання";
  }
}

function QuestionCard({
  question,
  index,
  count,
  locked,
  disabled,
  onMove,
  onEdit,
  onDelete,
}: QuestionCardProps) {
  return (
    <article className="test-question-card">
      <div className="test-question-card-header">
        <div className="test-question-identity">
          <span className="test-question-number">{index + 1}</span>
          <div className="test-question-identity-text">
            <span className="test-question-kind">
              {getTypeName(question.type)}
            </span>
            <span className="test-question-points">
              {question.points} балів
            </span>
          </div>
        </div>
        {!locked && (
          <div className="test-question-card-actions">
            <button
              className="test-icon-btn"
              type="button"
              aria-label="Перемістити питання вище"
              title="Вище"
              disabled={disabled || index === 0}
              onClick={() => onMove(question.id, -1)}
            >
              <ArrowUp size={17} />
            </button>
            <button
              className="test-icon-btn"
              type="button"
              aria-label="Перемістити питання нижче"
              title="Нижче"
              disabled={disabled || index === count - 1}
              onClick={() => onMove(question.id, 1)}
            >
              <ArrowDown size={17} />
            </button>
            <span className="test-question-action-divider" />
            <button
              className="test-icon-btn"
              type="button"
              aria-label="Редагувати питання"
              title="Редагувати"
              disabled={disabled}
              onClick={() => onEdit(question)}
            >
              <Pencil size={17} />
            </button>
            <button
              className="test-icon-btn test-icon-btn--danger"
              type="button"
              aria-label="Видалити питання"
              title="Видалити"
              disabled={disabled}
              onClick={() => onDelete(question)}
            >
              <Trash2 size={17} />
            </button>
          </div>
        )}
      </div>
      <h3>{question.text}</h3>
      <div className="test-preview-options">
        {[...question.answerOptions]
          .sort((a, b) => a.order - b.order)
          .map((option) => (
            <div
              key={option.id}
              className={`test-preview-option ${option.isCorrect ? "test-preview-option--correct" : ""}`}
            >
              <span className="test-preview-indicator">
                {option.isCorrect ? <Check size={14} /> : null}
              </span>
              <span>{option.text}</span>
              {option.isCorrect && <small>Правильна</small>}
            </div>
          ))}
      </div>
    </article>
  );
}

export default QuestionCard;
