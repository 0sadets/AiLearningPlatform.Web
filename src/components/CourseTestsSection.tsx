import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileQuestion,
  Play,
  Plus,
  RotateCcw,
  Target,
} from "lucide-react";

import { getCourseTests } from "../api/testsApi";
import { useToast } from "../context/ToastContext";
import type {  TestDto } from "../types/test";
import "../styles/course-tests.css";


interface CourseTestsSectionProps {
  courseId: number;
  isOwner: boolean;
}

function getStatus(test: TestDto): { label: string; className: string } {
  if (test.isArchived) {
    return { label: "Архівований", className: "archived" };
  }
  if (test.isPublished) {
    return { label: "Опублікований", className: "published" };
  }
  return { label: "Чернетка", className: "draft" };
}

function formatDeadline(value: string | null): string {
  if (!value) return "Без дедлайну";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дату не визначено";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
type StudentProgressView = {
  label: string;
  className: string;
};

function getStudentProgressView(test: TestDto): StudentProgressView {
  const progress = test.studentProgress;

  if (!progress) {
    return {
      label: "Доступний",
      className: "available",
    };
  }

  if (progress.canContinueAttempt && progress.activeAttemptId != null) {
    return {
      label: "У процесі",
      className: "in-progress",
    };
  }

  if (progress.isDeadlinePassed) {
    return {
      label: "Дедлайн минув",
      className: "unavailable",
    };
  }

  if (progress.remainingAttempts === 0) {
    return {
      label: "Спроби вичерпано",
      className: "completed",
    };
  }

  if (progress.completedAttemptsCount > 0) {
    return {
      label: "Є результати",
      className: "completed",
    };
  }

  if (progress.canStartNewAttempt) {
    return {
      label: "Не розпочато",
      className: "available",
    };
  }

  return {
    label: "Недоступний",
    className: "unavailable",
  };
}

function formatPercentage(value: number): string {
  return new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 2,
  }).format(value);
}
function CourseTestsSection({ courseId, isOwner }: CourseTestsSectionProps) {
  const [tests, setTests] = useState<TestDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadFailed(false);

    getCourseTests(courseId)
      .then((data) => {
        if (!active) return;
        setTests(data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadFailed(true);

        // Authorization is already handled globally by the Axios interceptor.
        if (error instanceof AxiosError && error.response?.status === 401) {
          return;
        }

        const message =
          error instanceof AxiosError &&
          typeof error.response?.data?.message === "string"
            ? error.response.data.message
            : "Не вдалося завантажити тести курсу.";

        showToast(message, "error");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId, refreshKey, showToast]);

  return (
    <section className="content-section course-tests-section">
      <div className="section-header course-tests-section-header">
        <div>
          <h2>Тести</h2>
          <p>
            {isOwner
              ? "Перевірка знань студентів та керування тестами"
              : "Перевірте свої знання за матеріалами курсу"}
          </p>
        </div>

        {isOwner && (
          <Link
            to={`/courses/${courseId}/tests/create`}
            className="secondary-button course-tests-create-button"
          >
            <Plus size={17} />
            Створити тест
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="course-tests-state" role="status">
          Завантаження тестів...
        </div>
      ) : loadFailed ? (
        <div className="course-tests-state">
          <FileQuestion size={28} />
          <h3>Не вдалося отримати тести</h3>
          <p>Перевірте підключення та спробуйте ще раз.</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setRefreshKey((current) => current + 1)}
          >
            <RotateCcw size={15} />
            Повторити
          </button>
        </div>
      ) : tests.length === 0 ? (
        <div className="course-tests-state">
          <ClipboardList size={30} />
          <h3>Тестів поки немає</h3>
          <p>
            {isOwner
              ? "Створіть перший тест, щоб перевірити знання студентів."
              : "Викладач поки не опублікував жодного тесту."}
          </p>
        </div>
      ) : (
        <div className="course-tests-grid">
          {tests.map((test) => {
           const status = isOwner
  ? getStatus(test)
  : getStudentProgressView(test);

const progress = !isOwner ? test.studentProgress : null;

const deadlineExpired = progress
  ? progress.isDeadlinePassed
  : !!test.deadline &&
    new Date(test.deadline).getTime() < Date.now();

            return (
              <article key={test.id} className="course-test-card">
                <div className="course-test-card-top">
                  <div className="course-test-icon" aria-hidden="true">
                    <ClipboardList size={20} />
                  </div>
                  <span
                    className={`course-test-status course-test-status--${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <h3>{test.title}</h3>
                <p className="course-test-description">
                  {test.description || "Опис тесту відсутній."}
                </p>

                <div className="course-test-info">
                  <span>
                    <FileQuestion size={15} />
                    {test.questionsCount} питань
                  </span>
                  <span>
                    <Target size={15} />
                    {test.totalPoints} балів
                  </span>
                  <span>
                    <RotateCcw size={15} />
                    {test.maxAttempts === null
                      ? "Необмежено спроб"
                      : `${test.maxAttempts} спроб(и)`}
                  </span>
                  <span
                    className={
                      deadlineExpired ? "course-test-deadline-expired" : ""
                    }
                  >
                    <CalendarDays size={15} />
                    {formatDeadline(test.deadline)}
                    {deadlineExpired && " · минув"}
                  </span>
                </div>
{progress && (
  <div className="course-test-progress">
    {progress.bestPercentage !== null ? (
      <>
        <div className="course-test-progress-heading">
          <span>
            <Target size={15} />
            Найкращий результат
          </span>

          <strong>
            {formatPercentage(progress.bestPercentage)}%
          </strong>
        </div>

        <div
          className="course-test-progress-track"
          role="progressbar"
          aria-label="Найкращий результат тесту"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.bestPercentage}
        >
          <div
            className="course-test-progress-fill"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, progress.bestPercentage),
              )}%`,
            }}
          />
        </div>

        {progress.bestScore !== null &&
          progress.bestMaxScore !== null && (
            <div className="course-test-progress-score">
              {progress.bestScore} із {progress.bestMaxScore} балів
            </div>
          )}
      </>
    ) : (
      <div className="course-test-progress-empty">
        <Clock3 size={16} />
        Результатів поки немає
      </div>
    )}

    <div className="course-test-progress-details">
      <span>
        <CheckCircle2 size={15} />
        Завершено: {progress.completedAttemptsCount}
      </span>

      <span>
        <RotateCcw size={15} />
        {progress.remainingAttempts === null
          ? "Спроби необмежені"
          : `Залишилось спроб: ${progress.remainingAttempts}`}
      </span>
    </div>
  </div>
)}
                <div className="course-test-actions">
                  {isOwner ? (
                    <>
                      <Link
                        className="course-test-primary-link"
                        to={`/tests/${test.id}/edit`}
                      >
                        {test.isPublished || test.isArchived
                          ? "Переглянути"
                          : "Редагувати"}
                        <ArrowUpRight size={15} />
                      </Link>
                      <Link
                        className="course-test-secondary-link"
                        to={`/tests/${test.id}/results`}
                      >
                        Результати
                      </Link>
                    </>
                  ) : (
                   <>
    {progress?.canContinueAttempt &&
    progress.activeAttemptId != null ? (
      <Link
        className="course-test-primary-link"
        to={`/tests/${test.id}/attempts/${progress.activeAttemptId}`}
      >
        <Play size={15} />
        Продовжити тест
      </Link>
    ) : progress?.canStartNewAttempt ? (
      <Link
        className="course-test-primary-link"
        to={`/tests/${test.id}`}
      >
        <Play size={15} />
        Почати тест
      </Link>
    ) : (
      <Link
        className="course-test-primary-link"
        to={`/tests/${test.id}`}
      >
        {progress && progress.completedAttemptsCount > 0
          ? "Переглянути результати"
          : "Деталі тесту"}
        <ArrowUpRight size={15} />
      </Link>
    )}

    {(progress?.canStartNewAttempt ||
      progress?.canContinueAttempt) && (
      <Link
        className="course-test-secondary-link"
        to={`/tests/${test.id}`}
      >
        Деталі
      </Link>
    )}
  </>
)}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CourseTestsSection;
