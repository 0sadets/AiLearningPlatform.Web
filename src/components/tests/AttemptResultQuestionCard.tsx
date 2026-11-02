import {
  CheckCircle2,
  Circle,
  Sparkles,
  XCircle,
} from "lucide-react";

import { QuestionType } from "../../types/testQuestion";

import type {
  AttemptQuestionView,
} from "../../types/attemptQuestionView";

interface Props {
  question: AttemptQuestionView;
  index: number;
  viewer: "student" | "teacher";
}

function getQuestionTypeName(type: QuestionType): string {
  switch (type) {
    case QuestionType.SingleChoice:
      return "Одна правильна відповідь";

    case QuestionType.MultipleChoice:
      return "Декілька правильних відповідей";

    case QuestionType.TrueFalse:
      return "Так / Ні";

    case QuestionType.Text:
      return "Текстова відповідь";

    default:
      return "Питання";
  }
}

function AttemptResultQuestionCard({
  question,
  index,
  viewer,
}: Props) {
  const options = [...question.answerOptions].sort(
    (a, b) => a.order - b.order,
  );

  const status = !question.isAnswered
    ? "skipped"
    : question.isCorrect
      ? "correct"
      : "incorrect";

  return (
    <article className="teacher-detail-question">
      <div className="teacher-detail-question-heading">
        <div className="teacher-detail-question-number">
          {index + 1}
        </div>

        <div className="teacher-detail-question-title">
          <h3>{question.text}</h3>

          <span>
            {getQuestionTypeName(question.type)}
            {" · "}
            {question.points} бал(ів)
          </span>
        </div>

        <span
          className={`teacher-detail-question-status teacher-detail-question-status--${status}`}
        >
          {status === "correct"
            ? "Правильно"
            : status === "incorrect"
              ? "Неправильно"
              : "Пропущено"}
        </span>
      </div>

      {options.length > 0 && (
        <div className="teacher-detail-options">
          {options.map((option) => {
            const correct = option.isCorrect;
            const selected = option.isSelected;

            const optionClass = correct
              ? "teacher-detail-option--correct"
              : selected
                ? "teacher-detail-option--incorrect"
                : "";

            return (
              <div
                key={option.id}
                className={`teacher-detail-option ${optionClass}`}
              >
                <span className="teacher-detail-option-icon">
                  {correct ? (
                    <CheckCircle2 size={20} />
                  ) : selected ? (
                    <XCircle size={20} />
                  ) : (
                    <Circle size={19} />
                  )}
                </span>

                <span className="teacher-detail-option-text">
                  {option.text}
                </span>

                <span className="teacher-detail-option-label">
                  {correct && selected
                    ? "Правильна · обрано"
                    : correct
                      ? "Правильна"
                      : selected
                        ? viewer === "student"
                          ? "Ваша відповідь"
                          : "Обрано студентом"
                        : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {question.type === QuestionType.Text && (
        <div className="attempt-result-text-answer">
          <strong>
            {viewer === "student"
              ? "Ваша текстова відповідь"
              : "Текстова відповідь студента"}
          </strong>

          <p>
            {question.textAnswer?.trim() ||
              "Текстову відповідь не надано."}
          </p>
        </div>
      )}

      <div className="teacher-detail-question-footer">
        <span>
          {!question.isAnswered
            ? "Відповідь не надано"
            : question.isCorrect
              ? viewer === "student"
                ? "Ви відповіли правильно"
                : "Студент відповів правильно"
              : viewer === "student"
                ? "Ваша відповідь не збігається з правильною"
                : "Відповідь студента не збігається з правильною"}
        </span>

        <strong>
          {question.earnedPoints !== null
            ? `${question.earnedPoints} / ${question.points} балів`
            : `Максимально: ${question.points} балів`}
        </strong>
      </div>

      {question.isAiGenerated && (
        <div className="attempt-result-ai-source">
          <div className="attempt-result-ai-source-heading">
            <Sparkles size={18} />
            <strong>Джерело LearnAI</strong>
          </div>

          {question.sourceMaterialTitle && (
            <p className="attempt-result-ai-material">
              {question.sourceMaterialTitle}
            </p>
          )}

          {question.sourceExcerpt ? (
            <blockquote>
              {question.sourceExcerpt}
            </blockquote>
          ) : (
            <p className="attempt-result-ai-empty">
              Фрагмент навчального матеріалу недоступний.
            </p>
          )}

          {question.sourceChunkIndex !== null && (
            <small>
              Фрагмент матеріалу №{question.sourceChunkIndex}
            </small>
          )}
        </div>
      )}
    </article>
  );
}

export default AttemptResultQuestionCard;