import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileQuestion,
  Play,
  RotateCcw,
  Target,
} from "lucide-react";

import { getTestById } from "../api/testsApi";
import {
  getMyTestAttempts,
  startTestAttempt,
} from "../api/testAttemptsApi";

import type { TestDto } from "../types/test";
import {
  TestAttemptStatus,
  type TestAttemptResultDto,
} from "../types/testAttempt";

import { useToast } from "../context/ToastContext";
import {
  getTestApiError,
  isUnauthorizedError,
} from "../utils/testForm";

import "../styles/test-details.css";

function formatDate(value: string | null) {
  if (!value) return "Без обмеження";

  return new Date(value).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TestDetailsPage() {
  const { testId: testIdParam } = useParams();
  const testId = Number(testIdParam);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const [test, setTest] = useState<TestDto | null>(null);
  const [attempts, setAttempts] = useState<TestAttemptResultDto[]>([]);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!Number.isSafeInteger(testId) || testId <= 0) {
        setErrorMessage("Некоректний ідентифікатор тесту.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const [testData, attemptsData] = await Promise.all([
          getTestById(testId),
          getMyTestAttempts(testId),
        ]);

        if (!active) return;

        setTest(testData);
        setAttempts(attemptsData);
      } catch (error) {
        if (!active) return;

        if (!isUnauthorizedError(error)) {
          setErrorMessage(
            getTestApiError(
              error,
              "Не вдалося завантажити інформацію про тест.",
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
  }, [testId]);

  const activeAttempt = attempts.find(
    (item) => item.status === TestAttemptStatus.InProgress,
  );

  const completedAttempts = attempts.filter(
    (item) => item.status === TestAttemptStatus.Completed,
  );

  const deadlineExpired =
    !!test?.deadline &&
    new Date(test.deadline).getTime() <= Date.now();

  const attemptsExhausted =
    test?.maxAttempts != null &&
    attempts.length >= test.maxAttempts;

  const canStart =
    !!test &&
    test.isPublished &&
    !test.isArchived &&
    !deadlineExpired &&
    !attemptsExhausted;

  async function handleStart() {
    if (!test || starting) return;

    setStarting(true);

    try {
      const attempt = await startTestAttempt(test.id);

      navigate(
        `/tests/${test.id}/attempts/${attempt.id}`,
      );
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        showToast(
          getTestApiError(error, "Не вдалося почати тест."),
          "error",
        );
      }
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="page student-test-page">
        <p>Завантаження тесту...</p>
      </div>
    );
  }

  if (errorMessage || !test) {
    return (
      <div className="page student-test-page">
        <Link to="/courses" className="student-test-back">
          <ArrowLeft size={17} />
          До курсів
        </Link>

        <div className="student-test-error">
          {errorMessage || "Тест не знайдено."}
        </div>
      </div>
    );
  }

  return (
    <div className="page student-test-page">
      <Link
        to={`/courses/${test.courseId}`}
        className="student-test-back"
      >
        <ArrowLeft size={17} />
        До курсу
      </Link>

      <header className="student-test-hero">
        <div className="student-test-hero-icon">
          <ClipboardList size={25} />
        </div>

        <div className="student-test-hero-content">
          <span className="student-test-eyebrow">
            Тестування знань
          </span>

          <h1>{test.title}</h1>

          <p>
            {test.description || "Опис тесту відсутній."}
          </p>
        </div>
      </header>

      <div className="student-test-stats">
        <div className="student-test-stat">
          <FileQuestion size={19} />
          <span>Питань</span>
          <strong>{test.questionsCount}</strong>
        </div>

        <div className="student-test-stat">
          <Target size={19} />
          <span>Максимум балів</span>
          <strong>{test.totalPoints}</strong>
        </div>

        <div className="student-test-stat">
          <RotateCcw size={19} />
          <span>Кількість спроб</span>
          <strong>
            {test.maxAttempts === null
              ? "Необмежено"
              : `${attempts.length} / ${test.maxAttempts}`}
          </strong>
        </div>

        <div className="student-test-stat">
          <CalendarDays size={19} />
          <span>Дедлайн</span>
          <strong>{formatDate(test.deadline)}</strong>
        </div>
      </div>

      <section className="student-test-panel">
        <h2>Готові перевірити свої знання?</h2>

        {activeAttempt ? (
          <>
            <p>
              У вас є незавершена спроба. Можна повернутися
              до проходження тесту.
            </p>

            <Link
              to={`/tests/${test.id}/attempts/${activeAttempt.id}`}
              className="student-test-primary"
            >
              <Play size={18} />
              Продовжити тест
            </Link>
          </>
        ) : (
          <>
            <p>
              Після початку спроба враховуватиметься
              у вашому ліміті. Відповіді будуть перевірені
              автоматично після завершення.
            </p>

            {canStart ? (
              <button
                type="button"
                className="student-test-primary"
                onClick={handleStart}
                disabled={starting}
              >
                <Play size={18} />
                {starting ? "Початок..." : "Почати тест"}
              </button>
            ) : (
              <div className="student-test-notice">
                {test.isArchived
                  ? "Тест архівовано. Нові спроби недоступні."
                  : !test.isPublished
                    ? "Тест ще не опубліковано."
                    : deadlineExpired
                      ? "Термін проходження тесту завершився."
                      : "Ви використали всі доступні спроби."}
              </div>
            )}
          </>
        )}
      </section>

      <section className="student-test-panel">
        <div className="student-test-section-heading">
          <div>
            <h2>Історія проходжень</h2>
            <p>
              Завершених спроб: {completedAttempts.length}
            </p>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="student-test-empty">
            <Clock3 size={26} />
            <p>Ви ще не проходили цей тест.</p>
          </div>
        ) : (
          <div className="student-attempts-list">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="student-attempt-row"
              >
                <div className="student-attempt-icon">
                  {attempt.status === TestAttemptStatus.Completed
                    ? <CheckCircle2 size={20} />
                    : <Clock3 size={20} />}
                </div>

                <div className="student-attempt-info">
                  <strong>
                    {attempt.status === TestAttemptStatus.Completed
                      ? "Завершена спроба"
                      : "У процесі"}
                  </strong>

                  <span>{formatDate(attempt.startedAt)}</span>
                </div>

                {attempt.status === TestAttemptStatus.Completed ? (
                  <>
                    <strong className="student-attempt-score">
                      {attempt.percentage ?? 0}%
                    </strong>

                    <Link
                      to={`/attempts/${attempt.id}/result`}
                      className="student-attempt-link"
                    >
                      Результат
                      <ArrowRight size={16} />
                    </Link>
                  </>
                ) : (
                  <Link
                    to={`/tests/${test.id}/attempts/${attempt.id}`}
                    className="student-attempt-link"
                  >
                    Продовжити
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default TestDetailsPage;