import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { getMyCourseAnalytics } from "../api/knowledgeAnalyticsApi";
import StudentKnowledgeDashboard from "../components/analytics/StudentKnowledgeDashboard";

import type {
  StudentKnowledgeAnalyticsDto,
} from "../types/knowledgeAnalytics";

import "../styles/knowledge-analytics.css";

function getAnalyticsError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 403) {
      return "У вас немає доступу до аналітики цього курсу.";
    }

    if (error.response?.status === 404) {
      return "Аналітика цього курсу поки недоступна.";
    }
  }

  return "Не вдалося завантажити аналітику. Перевірте з'єднання та спробуйте ще раз.";
}

export default function StudentAnalyticsPage() {
  const { courseId: courseIdParam } = useParams();

  const courseId = Number(courseIdParam);

  const [analytics, setAnalytics] =
    useState<StudentKnowledgeAnalyticsDto | null>(null);

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

    const load = async () => {
      try {
        const result = await getMyCourseAnalytics(courseId);

        if (active) {
          setAnalytics(result);
        }
      } catch (err) {
        if (active) {
          setError(getAnalyticsError(err));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
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
          <span className="ka-eyebrow">Навчальна аналітика</span>
          <h1>Моя аналітика</h1>
          <p>
            Ваші результати, навчальні поняття та
            рекомендації щодо повторення матеріалів.
          </p>
        </div>

        {analytics && (
          <button
            type="button"
            className="ka-refresh-button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            <RefreshCw size={16} />
            Оновити дані
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="ka-state" role="status">
          Завантажуємо результати навчання...
        </div>
      ) : error ? (
        <div className="ka-state ka-state--error" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="ka-refresh-button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            <RefreshCw size={16} />
            Спробувати ще раз
          </button>
        </div>
      ) : analytics ? (
        <StudentKnowledgeDashboard
          courseId={courseId}
          analytics={analytics}
        />
      ) : (
        <div className="ka-state">
          Даних аналітики поки немає.
        </div>
      )}
    </div>
  );
}