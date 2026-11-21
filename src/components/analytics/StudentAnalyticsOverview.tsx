import { BookOpenCheck, ClipboardCheck, Lightbulb } from "lucide-react";

import type { StudentKnowledgeAnalyticsDto } from "../../types/knowledgeAnalytics";

import { formatAnalyticsPercent } from "../../utils/knowledgeAnalytics";

interface Props {
  analytics: StudentKnowledgeAnalyticsDto;
}

export default function StudentAnalyticsOverview({ analytics }: Props) {
  const { summary, testProgress } = analytics;

  const hasTestProgress = testProgress != null;

  const total = hasTestProgress
    ? testProgress.totalAvailableTests
    : summary.totalConcepts;

  const completed = hasTestProgress
    ? testProgress.completedAvailableTests
    : summary.assessedConcepts;

  const percentage = hasTestProgress
    ? testProgress.completionPercent
    : total > 0
      ? (completed / total) * 100
      : null;

  const visualPercentage =
    percentage === null ? 0 : Math.min(100, Math.max(0, percentage));

  const ringLabel = hasTestProgress
    ? "Пройдені тести"
    : "Поняття з результатами";

  const recommendationsCount =
    summary.conceptsNeedingReview + summary.preliminaryConceptsNeedingReview;

  return (
    <section className="ka-overview" aria-label="Огляд навчання">
      <div className="ka-overview-heading">
        <div>
          <h2>Ваш навчальний прогрес</h2>
          <p>Основне про навчання та результати тестів.</p>
        </div>
      </div>

      <div className="ka-overview-grid">
        <div className="ka-overview-main">
          <div
            className="ka-overview-ring"
            role="img"
            aria-label={
              percentage === null
                ? `${ringLabel}: даних немає`
                : `${ringLabel}: ${formatAnalyticsPercent(percentage)}`
            }
            style={{
              background:
                percentage === null
                  ? "#e5e7eb"
                  : `conic-gradient(
                      #6366f1 ${visualPercentage}%,
                      #e5e7eb ${visualPercentage}% 100%
                    )`,
            }}
          >
            <div className="ka-overview-ring-inner">
              <strong>
                {percentage === null ? "—" : formatAnalyticsPercent(percentage)}
              </strong>

              <span>{ringLabel}</span>
            </div>
          </div>

          <div className="ka-overview-progress-info">
            <h3>
              {hasTestProgress ? "Проходження тестів" : "Що вже перевірено"}
            </h3>

            <p className="ka-overview-progress-count">
              {hasTestProgress
                ? `${completed} із ${total} доступних тестів`
                : `${completed} із ${total} понять`}
            </p>

            {total > 0 && (
              <div className="ka-overview-legend">
                <span>
                  <i className="ka-overview-legend-dot ka-overview-legend-dot--done" />
                  {completed} {hasTestProgress ? "завершено" : "з результатами"}
                </span>

                <span>
                  <i className="ka-overview-legend-dot" />
                  {hasTestProgress
                    ? testProgress.notCompletedAvailableTests
                    : Math.max(0, total - completed)}{" "}
                  {hasTestProgress ? "ще не завершено" : "без результатів"}
                </span>
              </div>
            )}

            <p className="ka-overview-progress-description">
              {hasTestProgress
                ? total > 0
                  ? "Діаграма показує, яку частину доступних тестів ви вже завершили."
                  : "У курсі поки немає доступних тестів."
                : "Показано частку понять, за якими вже є результати. Це не відсоток засвоєння курсу."}
            </p>
          </div>
        </div>

        <div className="ka-overview-metrics">
          <div className="ka-overview-metric">
            <span className="ka-overview-metric-icon">
              <ClipboardCheck size={19} />
            </span>

            <div>
              <strong>{summary.completedTests}</strong>
              <span>Завершених тестів</span>
              <small>За весь час навчання</small>
            </div>
          </div>

          <div className="ka-overview-metric">
            <span className="ka-overview-metric-icon">
              <BookOpenCheck size={19} />
            </span>

            <div>
              <strong>{summary.completedAttempts}</strong>
              <span>Проходжень тестів</span>
              <small>З урахуванням повторних спроб</small>
            </div>
          </div>

          <div className="ka-overview-metric">
            <span className="ka-overview-metric-icon">
              <Lightbulb size={19} />
            </span>

            <div>
              <strong>{recommendationsCount}</strong>
              <span>Рекомендацій для повторення</span>
              <small>
                {summary.preliminaryConceptsNeedingReview > 0
                  ? `Попередніх: ${summary.preliminaryConceptsNeedingReview}`
                  : "За результатами відповідей"}
              </small>
            </div>
          </div>
        </div>
      </div>

      {summary.assessedConcepts > 0 &&
        summary.sufficientlyAssessedConcepts === 0 && (
          <p className="ka-overview-note">
            Результати за окремими поняттями поки попередні. Щоб отримати
            точнішу картину, потрібно більше перевірочних відповідей.
          </p>
        )}
    </section>
  );
}
