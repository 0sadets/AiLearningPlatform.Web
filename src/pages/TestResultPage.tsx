import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarDays,
  CheckCircle2,
  Target,
} from "lucide-react";

import { getTestAttemptResult } from "../api/testAttemptsApi";
import { getTestById } from "../api/testsApi";

import type { TestDto } from "../types/test";
import type { TestAttemptResultDto } from "../types/testAttempt";

import {
  getTestApiError,
  isUnauthorizedError,
} from "../utils/testForm";

import "../styles/test-result.css";

function TestResultPage() {
  const { attemptId: attemptIdParam } = useParams();
  const attemptId = Number(attemptIdParam);

  const [result, setResult] =
    useState<TestAttemptResultDto | null>(null);

  const [test, setTest] = useState<TestDto | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (
        !Number.isSafeInteger(attemptId) ||
        attemptId <= 0
      ) {
        setErrorMessage("Некоректний ідентифікатор спроби.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const resultData = await getTestAttemptResult(attemptId);
        const testData = await getTestById(resultData.testId);

        if (!active) return;

        setResult(resultData);
        setTest(testData);
      } catch (error) {
        if (!active) return;

        if (!isUnauthorizedError(error)) {
          setErrorMessage(
            getTestApiError(
              error,
              "Не вдалося отримати результат тесту.",
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
  }, [attemptId]);

  if (loading) {
    return (
      <div className="page test-result-page">
        <p>Завантаження результату...</p>
      </div>
    );
  }

  if (errorMessage || !result || !test) {
    return (
      <div className="page test-result-page">
        <Link to="/courses" className="student-test-back">
          <ArrowLeft size={17} />
          До курсів
        </Link>

        <div className="student-test-error">
          {errorMessage || "Результат не знайдено."}
        </div>
      </div>
    );
  }

  const percentage = result.percentage ?? 0;

  const completedAt = result.completedAt
    ? new Date(result.completedAt).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Не визначено";

  return (
    <div className="page test-result-page">
      <Link
        to={`/tests/${test.id}`}
        className="student-test-back"
      >
        <ArrowLeft size={17} />
        До тесту
      </Link>

      <section className="test-result-card">
        <div className="test-result-icon">
          <Award size={33} />
        </div>

        <span className="test-result-eyebrow">
          <CheckCircle2 size={16} />
          Тест завершено
        </span>

        <h1>Ваш результат</h1>

        <p className="test-result-description">
          {test.title}
        </p>

        <div className="test-result-score-circle">
          <strong>
            {Number(percentage.toFixed(1))}%
          </strong>
          <span>Ваш результат</span>
        </div>

        <div className="test-result-summary">
          <div>
            <Target size={20} />
            <span>Отримано балів</span>
            <strong>
              {result.score ?? 0} із {result.maxScore ?? 0}
            </strong>
          </div>

          <div>
            <CalendarDays size={20} />
            <span>Дата завершення</span>
            <strong>{completedAt}</strong>
          </div>
        </div>

        <div className="test-result-actions">
          <Link
            className="test-result-secondary"
            to={`/courses/${test.courseId}`}
          >
            До курсу
          </Link>

          <Link
            className="test-result-primary"
            to={`/tests/${test.id}`}
          >
            До тесту та історії спроб
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <p className="test-result-note">
        Результат обчислено автоматично. Детальний розбір
        правильних відповідей наразі недоступний.
      </p>
    </div>
  );
}

export default TestResultPage;