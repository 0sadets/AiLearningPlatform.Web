import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  ListChecks,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import { getTestById } from "../api/testsApi";
import { getTeacherTestResults } from "../api/testResultsApi";

import {
  TestAttemptStatus,
} from "../types/testAttempt";

import type {
  TeacherStudentResultDto,
  TeacherTestResultsDto,
} from "../types/testResult";

import {
  getTestApiError,
  isUnauthorizedError,
} from "../utils/testForm";

import {
  formatTestPercentage,
  formatTestResultDate,
  formatTestScore,
  getStudentInitials,
} from "../utils/testResultFormat";

import "../styles/teacher-test-results.css";

type StudentRowProps = {
  student: TeacherStudentResultDto;
};

function StudentResultRow({ student }: StudentRowProps) {
  const [expanded, setExpanded] = useState(false);

  const fullName =
    `${student.firstName} ${student.lastName}`.trim();

  const sortedAttempts = [...student.attempts].sort(
    (a, b) =>
      new Date(b.startedAt).getTime() -
      new Date(a.startedAt).getTime(),
  );

  return (
    <article className="teacher-student-row">
      <div className="teacher-student-main">
        <div className="teacher-student-avatar">
          {getStudentInitials(
            student.firstName,
            student.lastName,
          )}
        </div>

        <div className="teacher-student-identity">
          <strong>{fullName || student.email}</strong>
          <span>{student.email}</span>
        </div>

        <div className="teacher-student-metric">
          <span>Спроб</span>
          <strong>{student.attemptsCount}</strong>
        </div>

        <div className="teacher-student-metric">
          <span>Найкращий результат</span>
          <strong>
            {formatTestPercentage(student.bestPercentage)}
          </strong>
          <small>
            {formatTestScore(
              student.bestScore,
              student.bestMaxScore,
            )}
          </small>
        </div>

        <button
          type="button"
          className="teacher-student-expand"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? `Згорнути спроби: ${fullName}`
              : `Переглянути спроби: ${fullName}`
          }
        >
          {expanded ? (
            <ChevronUp size={19} />
          ) : (
            <ChevronDown size={19} />
          )}
        </button>
      </div>

      {expanded && (
        <div className="teacher-student-attempts">
          <div className="teacher-student-attempts-heading">
            <h4>Історія спроб</h4>
            <span>
              Останнє завершення:{" "}
              {formatTestResultDate(
                student.lastCompletedAt,
              )}
            </span>
          </div>

          <div className="teacher-attempt-table-wrap">
            <table className="teacher-attempt-table">
              <thead>
                <tr>
                  <th>Спроба</th>
                  <th>Початок</th>
                  <th>Статус</th>
                  <th>Бали</th>
                  <th>Результат</th>
                  <th aria-label="Дії" />
                </tr>
              </thead>

              <tbody>
                {sortedAttempts.map((attempt, index) => {
                  const completed =
                    attempt.status ===
                    TestAttemptStatus.Completed;

                  return (
                    <tr key={attempt.attemptId}>
                      <td>
                        №{sortedAttempts.length - index}
                      </td>

                      <td>
                        {formatTestResultDate(
                          attempt.startedAt,
                        )}
                      </td>

                      <td>
                        <span
                          className={`teacher-attempt-status ${
                            completed
                              ? "teacher-attempt-status--completed"
                              : "teacher-attempt-status--active"
                          }`}
                        >
                          {completed
                            ? "Завершена"
                            : "У процесі"}
                        </span>
                      </td>

                      <td>
                        {formatTestScore(
                          attempt.score,
                          attempt.maxScore,
                        )}
                      </td>

                      <td>
                        {formatTestPercentage(
                          attempt.percentage,
                        )}
                      </td>

                      <td>
                        {completed && (
                          <Link
                            className="teacher-attempt-detail-link"
                            to={`/attempts/${attempt.attemptId}/details`}
                          >
                            Деталі
                            <ArrowUpRight size={15} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
  );
}

function TeacherTestResultsPage() {
  const { testId: testIdParam } = useParams();
  const testId = Number(testIdParam);

  const [data, setData] =
    useState<TeacherTestResultsDto | null>(null);

  const [courseId, setCourseId] =
    useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    if (
      !testIdParam ||
      !Number.isSafeInteger(testId) ||
      testId <= 0
    ) {
      setLoadError("Некоректний ідентифікатор тесту.");
      setIsLoading(false);
      return;
    }

    async function load() {
      if (refreshKey === 0) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setLoadError("");

      try {
        const [test, results] = await Promise.all([
          getTestById(testId),
          getTeacherTestResults(testId),
        ]);

        if (!active) return;

        setCourseId(test.courseId);
        setData(results);
      } catch (error) {
        if (!active) return;

        if (!isUnauthorizedError(error)) {
          setLoadError(
            getTestApiError(
              error,
              "Не вдалося завантажити результати тесту.",
            ),
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [testId, testIdParam, refreshKey]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];

    const query = search.trim().toLocaleLowerCase("uk-UA");

    if (!query) return data.students;

    return data.students.filter((student) => {
      const value = [
        student.firstName,
        student.lastName,
        student.email,
      ]
        .join(" ")
        .toLocaleLowerCase("uk-UA");

      return value.includes(query);
    });
  }, [data, search]);

  const backPath = courseId
    ? `/courses/${courseId}`
    : "/courses";

  if (isLoading) {
    return (
      <div className="page teacher-results-page">
        <p className="teacher-results-loading">
          Завантаження результатів...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page teacher-results-page">
        <Link to={backPath} className="teacher-results-back">
          <ArrowLeft size={17} />
          До курсу
        </Link>

        <div className="teacher-results-error">
          {loadError || "Дані не знайдено."}
        </div>
      </div>
    );
  }

  return (
    <div className="page teacher-results-page">
      <Link to={backPath} className="teacher-results-back">
        <ArrowLeft size={17} />
        До курсу
      </Link>

      <header className="teacher-results-heading">
        <div className="teacher-results-heading-icon">
          <ClipboardList size={25} />
        </div>

        <div className="teacher-results-heading-text">
          <span>Результати тестування</span>
          <h1>{data.testTitle}</h1>
          <p>
            Статистика проходжень та результати
            студентів курсу
          </p>
        </div>

        <button
          type="button"
          className="teacher-results-refresh"
          disabled={isRefreshing}
          onClick={() =>
            setRefreshKey((current) => current + 1)
          }
        >
          <RefreshCw
            size={17}
            className={isRefreshing ? "is-spinning" : ""}
          />
          Оновити
        </button>
      </header>

      <div className="teacher-results-stat-grid">
        <div className="teacher-results-stat">
          <div className="teacher-results-stat-icon">
            <Users size={20} />
          </div>
          <span>Студентів</span>
          <strong>{data.studentsCount}</strong>
        </div>

        <div className="teacher-results-stat">
          <div className="teacher-results-stat-icon">
            <ListChecks size={20} />
          </div>
          <span>Усього спроб</span>
          <strong>{data.totalAttempts}</strong>
        </div>

        <div className="teacher-results-stat">
          <div className="teacher-results-stat-icon">
            <CheckCircle2 size={20} />
          </div>
          <span>Завершених</span>
          <strong>{data.completedAttempts}</strong>
        </div>

        <div className="teacher-results-stat">
          <div className="teacher-results-stat-icon">
            <Clock3 size={20} />
          </div>
          <span>У процесі</span>
          <strong>{data.inProgressAttempts}</strong>
        </div>
      </div>

      <section className="teacher-results-panel">
        <div className="teacher-results-panel-header">
          <div>
            <h2>Результати студентів</h2>
            <p>
              Відображаються студенти, які хоча б раз
              почали проходження тесту.
            </p>
          </div>

          <div className="teacher-results-search">
            <Search size={17} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Пошук студента..."
              aria-label="Пошук студента"
            />
          </div>
        </div>

        {loadError && (
          <div className="teacher-results-error">
            {loadError}
          </div>
        )}

        {data.students.length === 0 ? (
          <div className="teacher-results-empty">
            <Users size={32} />
            <h3>Студенти ще не проходили тест</h3>
            <p>
              Результати з'являться після початку
              першої спроби.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="teacher-results-empty">
            <Search size={28} />
            <h3>Нічого не знайдено</h3>
            <p>Спробуйте змінити пошуковий запит.</p>
          </div>
        ) : (
          <div className="teacher-results-students">
            {filteredStudents.map((student) => (
              <StudentResultRow
                key={student.userId}
                student={student}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default TeacherTestResultsPage;