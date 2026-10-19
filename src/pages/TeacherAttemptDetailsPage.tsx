import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock3,
  FileQuestion,
  Mail,
  Target,
  UserRound,
  XCircle,
} from "lucide-react";

import { getTeacherAttemptDetails } from "../api/testResultsApi";

import { QuestionType } from "../types/testQuestion";

import type {
  TeacherAttemptDetailsDto,
  TeacherQuestionResultDto,
} from "../types/testResult";

import {
  getTestApiError,
  isUnauthorizedError,
} from "../utils/testForm";

import {
  formatTestPercentage,
  formatTestResultDate,
  formatTestScore,
} from "../utils/testResultFormat";

import "../styles/teacher-attempt-details.css";

interface QuestionResultCardProps {
  question: TeacherQuestionResultDto;
  index: number;
}

function getQuestionTypeName(type: QuestionType): string {
  switch (type) {
    case QuestionType.SingleChoice:
      return "Одна правильна відповідь";

    case QuestionType.MultipleChoice:
      return "Декілька правильних відповідей";

    case QuestionType.TrueFalse:
      return "Так / Ні";

    default:
      return "Питання";
  }
}

function QuestionResultCard({
  question,
  index,
}: QuestionResultCardProps) {
  const options = [...question.answerOptions].sort(
    (a, b) => a.order - b.order,
  );

  const status = !question.wasAnswered
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
          <span>{getQuestionTypeName(question.type)}</span>
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
                      ? "Обрано студентом"
                      : ""}
              </span>
            </div>
          );
        })}
      </div>

      <div className="teacher-detail-question-footer">
        <span>
          {question.wasAnswered
            ? question.isCorrect
              ? "Студент відповів правильно"
              : "Відповідь студента не збігається з правильною"
            : "Студент не вибрав жодної відповіді"}
        </span>

        <strong>
          {question.earnedPoints} / {question.points} балів
        </strong>
      </div>
    </article>
  );
}

function TeacherAttemptDetailsPage() {
  const { attemptId: attemptIdParam } = useParams();

  const attemptId = Number(attemptIdParam);

  const [data, setData] =
    useState<TeacherAttemptDetailsDto | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    if (
      !attemptIdParam ||
      !Number.isSafeInteger(attemptId) ||
      attemptId <= 0
    ) {
      setLoadError("Некоректний ідентифікатор спроби.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setLoadError("");

      try {
        const result = await getTeacherAttemptDetails(
          attemptId,
        );

        if (!active) return;

        setData(result);
      } catch (error) {
        if (!active) return;

        if (!isUnauthorizedError(error)) {
          setLoadError(
            getTestApiError(
              error,
              "Не вдалося отримати деталі спроби.",
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [attemptId, attemptIdParam]);

  if (loading) {
    return (
      <div className="page teacher-attempt-page">
        <p className="teacher-attempt-loading">
          Завантаження відповідей студента...
        </p>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="page teacher-attempt-page">
        <Link
          to="/courses"
          className="teacher-attempt-back"
        >
          <ArrowLeft size={17} />
          До курсів
        </Link>

        <div className="teacher-attempt-error">
          {loadError || "Спробу не знайдено."}
        </div>
      </div>
    );
  }

  const questions = [...data.questions].sort(
    (a, b) => a.order - b.order,
  );

  const correctCount = questions.filter(
    (question) => question.wasAnswered && question.isCorrect,
  ).length;

  const incorrectCount = questions.filter(
    (question) => question.wasAnswered && !question.isCorrect,
  ).length;

  const skippedCount = questions.filter(
    (question) => !question.wasAnswered,
  ).length;

  return (
    <div className="page teacher-attempt-page">
      <Link
        to={`/tests/${data.testId}/results`}
        className="teacher-attempt-back"
      >
        <ArrowLeft size={17} />
        До результатів тесту
      </Link>

      <header className="teacher-attempt-heading">
        <div className="teacher-attempt-heading-icon">
          <ClipboardCheck size={25} />
        </div>

        <div>
          <span>Деталі проходження</span>
          <h1>{data.testTitle}</h1>
          <p>Спроба №{data.attemptId}</p>
        </div>
      </header>

      <section className="teacher-attempt-student-card">
        <div className="teacher-attempt-student-icon">
          <UserRound size={24} />
        </div>

        <div className="teacher-attempt-student-info">
          <h2>
            {data.firstName} {data.lastName}
          </h2>

          <p>
            <Mail size={15} />
            {data.email}
          </p>
        </div>

        <div className="teacher-attempt-student-result">
          <span>Підсумковий результат</span>
          <strong>
            {formatTestPercentage(data.percentage)}
          </strong>
          <small>
            {formatTestScore(
              data.score,
              data.maxScore,
            )}
          </small>
        </div>
      </section>

      <div className="teacher-attempt-summary">
        <div>
          <FileQuestion size={19} />
          <span>Питань</span>
          <strong>{questions.length}</strong>
        </div>

        <div>
          <CheckCircle2 size={19} />
          <span>Правильних</span>
          <strong>{correctCount}</strong>
        </div>

        <div>
          <XCircle size={19} />
          <span>Неправильних</span>
          <strong>{incorrectCount}</strong>
        </div>

        <div>
          <Clock3 size={19} />
          <span>Пропущених</span>
          <strong>{skippedCount}</strong>
        </div>
      </div>

      <section className="teacher-attempt-timeline">
        <div>
          <span>Початок</span>
          <strong>
            {formatTestResultDate(data.startedAt)}
          </strong>
        </div>

        <div>
          <span>Завершення</span>
          <strong>
            {formatTestResultDate(data.completedAt)}
          </strong>
        </div>

        <div>
          <span>Набрано балів</span>
          <strong>
            <Target size={16} />
            {formatTestScore(data.score, data.maxScore)}
          </strong>
        </div>
      </section>

      <div className="teacher-attempt-questions-heading">
        <h2>Відповіді на питання</h2>
        <p>
          Детальний перегляд результатів кожного питання
        </p>
      </div>

      <div className="teacher-attempt-questions">
        {questions.map((question, index) => (
          <QuestionResultCard
            key={question.questionId}
            question={question}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export default TeacherAttemptDetailsPage;