import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Send,
} from "lucide-react";

import {
  getTestAttempt,
  submitTestAttempt,
} from "../api/testAttemptsApi";

import type {
  TestAttemptDto,
  StudentTestQuestionDto,
  SubmitTestAttemptDto,
} from "../types/testAttempt";

import { QuestionType } from "../types/testQuestion";
import TestConfirmModal from "../components/tests/TestConfirmModal";

import {
  clearAttemptAnswers,
  loadAttemptAnswers,
  saveAttemptAnswers,
  type AttemptAnswers,
} from "../utils/testAttemptStorage";

import {
  getTestApiError,
  isUnauthorizedError,
} from "../utils/testForm";

import { useToast } from "../context/ToastContext";

import "../styles/test-taking.css";

function TestTakingPage() {
  const { testId: testIdParam, attemptId: attemptIdParam } =
    useParams();

  const testId = Number(testIdParam);
  const attemptId = Number(attemptIdParam);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const [attempt, setAttempt] = useState<TestAttemptDto | null>(null);
  const [answers, setAnswers] = useState<AttemptAnswers>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (
        !Number.isSafeInteger(attemptId) ||
        attemptId <= 0 ||
        !Number.isSafeInteger(testId) ||
        testId <= 0
      ) {
        setLoadError("Некоректний ідентифікатор спроби.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError("");
        setAttempt(null);

        const data = await getTestAttempt(attemptId);

        if (!active) return;

        if (data.testId !== testId) {
          setLoadError("Спроба не належить цьому тесту.");
          return;
        }

        const restored = loadAttemptAnswers(attemptId);

        // Відкидаємо відповіді, що не належать питанням цієї спроби.
        const validAnswers: AttemptAnswers = {};

        for (const question of data.questions) {
          const validOptionIds = new Set(
            question.answerOptions.map((option) => option.id),
          );

          const selected = (restored[question.id] ?? []).filter(
            (id) => validOptionIds.has(id),
          );

          validAnswers[question.id] =
            question.type === QuestionType.MultipleChoice
              ? selected
              : selected.slice(0, 1);
        }

        setAttempt(data);
        setAnswers(validAnswers);
        setCurrentIndex(0);
      } catch (error) {
        if (!active) return;

        if (!isUnauthorizedError(error)) {
          setLoadError(
            getTestApiError(
              error,
              "Не вдалося завантажити спробу. Можливо, її вже завершено.",
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
  }, [attemptId, testId]);

  const questions = attempt
    ? [...attempt.questions].sort((a, b) => a.order - b.order)
    : [];

  const currentQuestion = questions[currentIndex];

  const answeredCount = questions.filter(
    (question) => (answers[question.id] ?? []).length > 0,
  ).length;

  const unansweredCount = questions.length - answeredCount;

  const progress = questions.length
    ? (answeredCount / questions.length) * 100
    : 0;

  function changeAnswer(
    question: StudentTestQuestionDto,
    optionId: number,
  ) {
    if (submitting) return;

    const current = answers[question.id] ?? [];

    let nextSelected: number[];

    if (question.type === QuestionType.MultipleChoice) {
      nextSelected = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
    } else {
      nextSelected = [optionId];
    }

    const updated = {
      ...answers,
      [question.id]: nextSelected,
    };

    setAnswers(updated);
    saveAttemptAnswers(attemptId, updated);
  }

  async function handleSubmit() {
    if (!attempt || submitting) return;

    setSubmitting(true);

    const payload: SubmitTestAttemptDto = {
      answers: questions.map((question) => ({
        questionId: question.id,
        selectedOptionIds: answers[question.id] ?? [],
      })),
    };

    try {
      await submitTestAttempt(attempt.id, payload);

      clearAttemptAnswers(attempt.id);

      showToast("Тест успішно завершено.", "success");

      navigate(`/attempts/${attempt.id}/result`, {
        replace: true,
      });
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        showToast(
          getTestApiError(
            error,
            "Не вдалося завершити тест.",
          ),
          "error",
        );
      }

      // Якщо запит завершився на сервері, але відповідь загубилася,
      // залишаємо відповіді до перевірки стану спроби.
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="page test-taking-page">
        <p>Завантаження питань...</p>
      </div>
    );
  }

  if (loadError || !attempt) {
    return (
      <div className="page test-taking-page">
        <Link
          to={`/tests/${testId}`}
          className="student-test-back"
        >
          <ArrowLeft size={17} />
          До тесту
        </Link>

        <div className="student-test-error">
          {loadError || "Спробу не знайдено."}
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="page test-taking-page">
        <p>У цьому тесті немає доступних питань.</p>
      </div>
    );
  }

  const isMultiple =
    currentQuestion.type === QuestionType.MultipleChoice;

  const selectedIds = answers[currentQuestion.id] ?? [];

  return (
    <div className="page test-taking-page">
      <Link
        to={`/tests/${testId}`}
        className="student-test-back"
      >
        <ArrowLeft size={17} />
        До тесту
      </Link>

      <header className="test-taking-header">
        <div className="test-taking-heading">
          <div className="test-taking-heading-icon">
            <ClipboardList size={24} />
          </div>

          <div>
            <span>Проходження тесту</span>
            <h1>{attempt.testTitle}</h1>
          </div>
        </div>

        <span className="test-taking-status">
          Спроба в процесі
        </span>
      </header>

      <section className="test-taking-progress-card">
        <div className="test-taking-progress-labels">
          <strong>
            Питання {currentIndex + 1} із {questions.length}
          </strong>

          <span>
            Відповіді: {answeredCount}/{questions.length}
          </span>
        </div>

        <div
          className="test-taking-progress-track"
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-label="Кількість питань із відповідями"
        >
          <div
            className="test-taking-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      <section className="test-taking-question-card">
        <div className="test-taking-question-top">
          <span className="test-taking-question-number">
            Питання {currentIndex + 1}
          </span>

          <span className="test-taking-question-points">
            {currentQuestion.points} балів
          </span>
        </div>

        <h2>{currentQuestion.text}</h2>

        <p className="test-taking-question-hint">
          {isMultiple
            ? "Оберіть усі варіанти, які вважаєте правильними."
            : "Оберіть одну правильну відповідь."}
        </p>

        <div className="test-taking-options">
          {[...currentQuestion.answerOptions]
            .sort((a, b) => a.order - b.order)
            .map((option) => {
              const selected = selectedIds.includes(option.id);

              return (
                <label
                  key={option.id}
                  className={`test-taking-option ${
                    selected ? "test-taking-option--selected" : ""
                  }`}
                >
                  <input
                    type={isMultiple ? "checkbox" : "radio"}
                    name={`question-${currentQuestion.id}`}
                    checked={selected}
                    disabled={submitting}
                    onChange={() =>
                      changeAnswer(currentQuestion, option.id)
                    }
                  />

                  <span>{option.text}</span>
                </label>
              );
            })}
        </div>

        <div className="test-taking-navigation">
          <button
            type="button"
            className="test-taking-secondary"
            disabled={currentIndex === 0 || submitting}
            onClick={() =>
              setCurrentIndex((current) => current - 1)
            }
          >
            <ArrowLeft size={17} />
            Назад
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              className="test-taking-primary"
              disabled={submitting}
              onClick={() =>
                setCurrentIndex((current) => current + 1)
              }
            >
              Наступне
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              className="test-taking-primary"
              disabled={submitting}
              onClick={() => setConfirmOpen(true)}
            >
              <Send size={17} />
              Завершити тест
            </button>
          )}
        </div>
      </section>

      <section className="test-taking-index-card">
        <div className="test-taking-index-header">
          <h3>Навігація між питаннями</h3>

          <span>
            {unansweredCount === 0
              ? "Усі питання мають відповіді"
              : `Без відповіді: ${unansweredCount}`}
          </span>
        </div>

        <div className="test-taking-index-list">
          {questions.map((question, index) => {
            const answered =
              (answers[question.id] ?? []).length > 0;

            return (
              <button
                type="button"
                key={question.id}
                className={[
                  "test-taking-index-item",
                  currentIndex === index
                    ? "test-taking-index-item--current"
                    : "",
                  answered
                    ? "test-taking-index-item--answered"
                    : "",
                ].join(" ")}
                onClick={() => setCurrentIndex(index)}
                disabled={submitting}
                aria-label={`Питання ${index + 1}${
                  answered ? ", є відповідь" : ", без відповіді"
                }`}
                aria-current={
                  currentIndex === index ? "step" : undefined
                }
              >
                {answered && currentIndex !== index ? (
                  <CheckCircle2 size={18} />
                ) : (
                  index + 1
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="test-taking-finish-link"
          disabled={submitting}
          onClick={() => setConfirmOpen(true)}
        >
          Завершити проходження
          <ArrowRight size={16} />
        </button>
      </section>

      {confirmOpen && (
        <TestConfirmModal
          title="Завершити тест?"
          description={
            unansweredCount > 0
              ? `Ви залишили без відповіді ${unansweredCount} питань. За них буде нараховано 0 балів. Після завершення змінити відповіді неможливо.`
              : "Ви відповіли на всі питання. Після завершення змінити відповіді буде неможливо."
          }
          confirmLabel="Завершити тест"
          isProcessing={submitting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleSubmit}
        />
      )}
    </div>
  );
}

export default TestTakingPage;