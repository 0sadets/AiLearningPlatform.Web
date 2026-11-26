import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { getCourseAnalyticsOverview } from "../api/knowledgeAnalyticsApi";
import { getCourseTests } from "../api/testsApi";
import TeacherKnowledgeDashboard from "../components/analytics/TeacherKnowledgeDashboard";

import type {
  TeacherKnowledgeAnalyticsDto,
} from "../types/knowledgeAnalytics";

import "../styles/knowledge-analytics.css";

function getOverviewError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 403) {
      return "Перегляд аналітики доступний лише викладачу цього курсу.";
    }

    if (error.response?.status === 404) {
      return "Аналітика курсу поки недоступна.";
    }
  }

  return "Не вдалося завантажити аналітику курсу. Спробуйте ще раз.";
}

export default function TeacherAnalyticsPage() {
  const { courseId: courseIdParam } = useParams();

  const courseId = Number(courseIdParam);

  const [analytics, setAnalytics] =
    useState<TeacherKnowledgeAnalyticsDto | null>(null);

  const [testNames, setTestNames] =
    useState<Record<number, string>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      setError("Некоректний ідентифікатор курсу.");
      setIsLoading(false);
      return;
    }

    let active = true;

    setIsLoading(true);
    setError(null);
    setAnalytics(null);
    setTestNames({});

    const load = async () => {
      const [overviewResult, testsResult] =
        await Promise.allSettled([
          getCourseAnalyticsOverview(courseId),
          getCourseTests(courseId),
        ]);

      if (!active) return;

      if (overviewResult.status === "fulfilled") {
        setAnalytics(overviewResult.value);
      } else {
        setError(getOverviewError(overviewResult.reason));
      }

      if (testsResult.status === "fulfilled") {
        setTestNames(
          Object.fromEntries(
            testsResult.value.map((test) => [
              test.id,
              test.title,
            ]),
          ),
        );
      }

      setIsLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [courseId, reloadKey]);

  return (
    <div className="page ka-page">
      <Link
        to={
          Number.isSafeInteger(courseId) && courseId > 0
            ? `/courses/${courseId}`
            : "/courses"
        }
        className="ka-back-link"
      >
        <ArrowLeft size={17} />
        До курсу
      </Link>

      <header className="ka-page-header">
        <div>
          <span className="ka-eyebrow">
            Аналітика для викладача
          </span>

          <h1>Аналітика курсу</h1>

          <p>
            Аналізуйте навчальні результати студентів,
            складні теми та питання, які потребують уваги.
          </p>
        </div>

        {analytics && (
          <button
            type="button"
            className="ka-refresh-button"
            onClick={() =>
              setReloadKey((value) => value + 1)
            }
          >
            <RefreshCw size={16} />
            Оновити дані
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="ka-state" role="status">
          Завантажуємо аналітику курсу...
        </div>
      ) : error ? (
        <div className="ka-state ka-state--error" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="ka-refresh-button"
            onClick={() =>
              setReloadKey((value) => value + 1)
            }
          >
            <RefreshCw size={16} />
            Спробувати ще раз
          </button>
        </div>
      ) : analytics ? (
        <TeacherKnowledgeDashboard
          courseId={courseId}
          analytics={analytics}
          testNames={testNames}
        />
      ) : (
        <div className="ka-state">
          Даних аналітики поки немає.
        </div>
      )}
    </div>
  );
}