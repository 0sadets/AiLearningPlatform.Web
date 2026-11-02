import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileQuestion,
  Mail,
  Target,
  UserRound,
  XCircle,
} from "lucide-react";

import { getTeacherAttemptDetails } from "../api/testResultsApi";


import type {
  TeacherAttemptDetailsDto,
} from "../types/testResult";
import AttemptResultQuestionCard from "../components/tests/AttemptResultQuestionCard";

import {
  mapTeacherQuestionToView,
} from "../utils/attemptQuestionMapper";

import "../styles/student-attempt-result.css";
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

 const questions = data.questions
  .map(mapTeacherQuestionToView)
  .sort((a, b) => a.order - b.order);

 const correctCount = questions.filter(
  (question) => question.isAnswered && question.isCorrect,
).length;

const incorrectCount = questions.filter(
  (question) => question.isAnswered && !question.isCorrect,
).length;

const skippedCount = questions.filter(
  (question) => !question.isAnswered,
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
  <AttemptResultQuestionCard
    key={question.questionId}
    question={question}
    index={index}
    viewer="teacher"
  />
))}
      </div>
    </div>
  );
}

export default TeacherAttemptDetailsPage;