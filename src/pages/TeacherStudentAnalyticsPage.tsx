import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { getStudentCourseAnalytics } from "../api/knowledgeAnalyticsApi";
import StudentKnowledgeDashboard from "../components/analytics/StudentKnowledgeDashboard";

import type { StudentKnowledgeAnalyticsDto } from "../types/knowledgeAnalytics";

import "../styles/knowledge-analytics.css";

export default function TeacherStudentAnalyticsPage() {
  const { courseId: courseParam, studentId: studentParam } = useParams();

  const location = useLocation();

  const courseId = Number(courseParam);
  const studentId = Number(studentParam);

  const routeState: unknown = location.state;

  const studentName =
    routeState &&
    typeof routeState === "object" &&
    "studentName" in routeState &&
    typeof routeState.studentName === "string"
      ? routeState.studentName
      : null;

  const [analytics, setAnalytics] =
    useState<StudentKnowledgeAnalyticsDto | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (
      !Number.isSafeInteger(courseId) ||
      courseId <= 0 ||
      !Number.isSafeInteger(studentId) ||
      studentId <= 0
    ) {
      setError("Некоректне посилання на результати студента.");
      setIsLoading(false);
      return;
    }

    let active = true;

    setIsLoading(true);
    setError(null);
    setAnalytics(null);

    const load = async () => {
      try {
        const result = await getStudentCourseAnalytics(courseId, studentId);

        if (active) setAnalytics(result);
      } catch (err) {
        if (!active) return;

        if (isAxiosError(err) && err.response?.status === 403) {
          setError("У вас немає доступу до результатів цього студента.");
        } else if (isAxiosError(err) && err.response?.status === 404) {
          setError("Результати студента не знайдено.");
        } else {
          setError("Не вдалося завантажити результати студента.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [courseId, studentId, reloadKey]);

  const backPath =
    Number.isSafeInteger(courseId) && courseId > 0
      ? `/courses/${courseId}/analytics/overview`
      : "/courses";

  return (
    <div className="page ka-page">
      <Link to={backPath} className="ka-back-link">
        <ArrowLeft size={17} />
        До аналітики курсу
      </Link>

      <header className="ka-page-header">
        <div>
          <span className="ka-eyebrow">Персональні результати</span>

          <h1>
            {studentName ? `Аналітика: ${studentName}` : "Аналітика студента"}
          </h1>

          <p>
            Результати тестування, засвоєння понять і рекомендації для навчання.
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
          Завантажуємо результати студента...
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
          viewer="teacher"
        />
      ) : (
        <div className="ka-state">Даних поки немає.</div>
      )}
    </div>
  );
}
