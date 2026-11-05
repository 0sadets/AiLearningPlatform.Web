import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  mapStudentQuestionToView,
} from "../utils/attemptQuestionMapper";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileQuestion,
  Target,
  XCircle,
} from "lucide-react";

import { getStudentAttemptResult } from "../api/testResultsApi";

import AttemptResultQuestionCard from "../components/tests/AttemptResultQuestionCard";

import type { StudentAttemptResultDto } from "../types/studentAttemptResult";

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
import "../styles/student-attempt-result.css";

function StudentAttemptResultPage() {
  const { attemptId: attemptIdParam } = useParams();

  const attemptId = Number(attemptIdParam);

  const [data, setData] =
    useState<StudentAttemptResultDto | null>(null);

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
      setData(null);

      try {
        const result = await getStudentAttemptResult(attemptId);

        if (!active) return;

        setData(result);
      } catch (error) {
        if (!active) return;

        if (!isUnauthorizedError(error)) {
          setLoadError(
            getTestApiError(
              error,
              "Не вдалося отримати результат спроби.",
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
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
          Завантаження результату...
        </p>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="page teacher-attempt-page">
        <Link to="/courses" className="teacher-attempt-back">
          <ArrowLeft size={17} />
          До курсів
        </Link>

        <div className="teacher-attempt-error">
          {loadError || "Результат спроби не знайдено."}
        </div>
      </div>
    );
  }

const questions = data.questions
  .map(mapStudentQuestionToView)
  .sort((a, b) => a.order - b.order);

  const correctCount = questions.filter(
    (question) =>
      question.isAnswered && question.isCorrect,
  ).length;

  const incorrectCount = questions.filter(
    (question) =>
      question.isAnswered && !question.isCorrect,
  ).length;

  const skippedCount = questions.filter(
    (question) => !question.isAnswered,
  ).length;

  return (
    <div className="page teacher-attempt-page student-attempt-result-page">
      <Link
  to={`/attempts/${data.id}/result`}
  className="teacher-attempt-back"
>
  <ArrowLeft size={17} />
  До результату спроби
</Link>

      <header className="teacher-attempt-heading">
        <div className="teacher-attempt-heading-icon">
          <ClipboardCheck size={25} />
        </div>

        <div>
          <span>Результат проходження</span>
          <h1>Результат тесту</h1>
          <p>Спроба №{data.id}</p>
        </div>
      </header>

      <section className="student-attempt-result-card">
        <div className="student-attempt-result-card-info">
          <span>Ваш підсумковий результат</span>

          <strong>
            {formatTestPercentage(data.percentage)}
          </strong>

          <p>
            {formatTestScore(
              data.score,
              data.maxScore,
            )}
          </p>
        </div>

        <div className="student-attempt-result-card-icon">
          <Target size={30} />
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
            {formatTestScore(
              data.score,
              data.maxScore,
            )}
          </strong>
        </div>
      </section>

      <div className="teacher-attempt-questions-heading">
        <h2>Розбір відповідей</h2>
        <p>
          Перегляньте свої відповіді, правильні варіанти
          та пояснення з навчальних матеріалів.
        </p>
      </div>

      <div className="teacher-attempt-questions">
        {questions.map((question, index) => (
          <AttemptResultQuestionCard
  key={question.questionId}
  question={question}
  index={index}
  viewer="student"
/>
        ))}
      </div>
    </div>
  );
}

export default StudentAttemptResultPage;