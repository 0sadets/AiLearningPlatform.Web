import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, BookOpen, ChevronRight, Search, X } from "lucide-react";

import AnalyticsCollapsibleSection from "./AnalyticsCollapsibleSection";
import StudentAnalyticsOverview from "./StudentAnalyticsOverview";

import type {
  AnalyticsDataStatus,
  AnalyticsMaterialDto,
  StudentConceptAnalyticsDto,
  StudentKnowledgeAnalyticsDto,
} from "../../types/knowledgeAnalytics";

import {
  formatAnalyticsDate,
  formatAnalyticsPercent,
  getAnalyticsDataStatusLabel,
  getAnalyticsScoreColor,
  getRecommendationPriorityLabel,
  getReviewPriorityLabel,
} from "../../utils/knowledgeAnalytics";

interface Props {
  courseId: number;
  analytics: StudentKnowledgeAnalyticsDto;
  viewer?: "student" | "teacher";
}

type ConceptSort = "name" | "lowest" | "highest" | "questions";

function AnalyticsProgress({
  value,
  status,
}: {
  value: number | null;
  status: AnalyticsDataStatus;
}) {
  const hasValue = value !== null && status !== "NoData";

  return (
    <div
      className={`ka-progress-track ${
        status === "Limited" ? "ka-progress--limited" : ""
      }`}
      aria-label={
        hasValue ? formatAnalyticsPercent(value) : "Немає результатів"
      }
    >
      {hasValue && (
        <div
          className="ka-progress-fill"
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            backgroundColor: getAnalyticsScoreColor(value),
          }}
        />
      )}
    </div>
  );
}

function AnalyticsMaterials({
  courseId,
  materials,
}: {
  courseId: number;
  materials: AnalyticsMaterialDto[];
}) {
  if (materials.length === 0) {
    return (
      <p className="ka-muted">Пов'язаних навчальних матеріалів поки немає.</p>
    );
  }

  return (
    <div className="ka-material-list">
      {materials.map((material, index) => (
        <div
          key={`${material.materialId}-${material.chunkIndex}-${index}`}
          className="ka-material-reference"
        >
          <Link
            to={`/courses/${courseId}#material-${material.materialId}`}
            className="ka-material-link"
          >
            <BookOpen size={15} />
            {material.materialTitle}
          </Link>

          {material.excerpt && <blockquote>{material.excerpt}</blockquote>}
        </div>
      ))}
    </div>
  );
}

function compareScores(
  a: StudentConceptAnalyticsDto,
  b: StudentConceptAnalyticsDto,
  descending: boolean,
): number {
  const aScore = a.dataStatus === "NoData" ? null : a.observedMasteryPercent;

  const bScore = b.dataStatus === "NoData" ? null : b.observedMasteryPercent;

  if (aScore === null && bScore === null) {
    return a.name.localeCompare(b.name, "uk-UA");
  }

  if (aScore === null) return 1;
  if (bScore === null) return -1;

  return descending ? bScore - aScore : aScore - bScore;
}

function countLabel(count: number, forms: [string, string, string]): string {
  const lastTwo = count % 100;
  const last = count % 10;

  const form =
    lastTwo >= 11 && lastTwo <= 14
      ? forms[2]
      : last === 1
        ? forms[0]
        : last >= 2 && last <= 4
          ? forms[1]
          : forms[2];

  return `${count} ${form}`;
}

export default function StudentKnowledgeDashboard({
  courseId,
  analytics,
  viewer = "student",
}: Props) {
  const { concepts, topics, recommendations, attemptHistory } = analytics;

  const [conceptSearch, setConceptSearch] = useState("");
  const [conceptSort, setConceptSort] = useState<ConceptSort>("name");

  const [selectedConceptId, setSelectedConceptId] = useState<number | null>(
    null,
  );

  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  const conceptsById = useMemo(
    () => new Map(concepts.map((concept) => [concept.conceptId, concept])),
    [concepts],
  );

  const selectedConcept =
    selectedConceptId === null
      ? null
      : (conceptsById.get(selectedConceptId) ?? null);

  const filteredConcepts = useMemo(() => {
    const query = conceptSearch.trim().toLocaleLowerCase("uk-UA");

    return [...concepts]
      .filter((concept) =>
        concept.name.toLocaleLowerCase("uk-UA").includes(query),
      )
      .sort((a, b) => {
        if (conceptSort === "lowest") {
          return compareScores(a, b, false);
        }

        if (conceptSort === "highest") {
          return compareScores(a, b, true);
        }

        if (conceptSort === "questions") {
          return b.questionsCount - a.questionsCount;
        }

        return a.name.localeCompare(b.name, "uk-UA");
      });
  }, [concepts, conceptSearch, conceptSort]);

  const chartConcepts = useMemo(
    () =>
      concepts
        .filter(
          (concept) =>
            concept.observedMasteryPercent !== null &&
            concept.dataStatus !== "NoData",
        )
        .sort((a, b) => compareScores(a, b, false))
        .slice(0, 10),
    [concepts],
  );

  const orderedHistory = useMemo(
    () =>
      [...attemptHistory].sort(
        (a, b) =>
          new Date(b.completedAtUtc).getTime() -
          new Date(a.completedAtUtc).getTime(),
      ),
    [attemptHistory],
  );

  const testOptions = useMemo(
    () =>
      [
        ...new Map(
          orderedHistory.map(
            (attempt) => [attempt.testId, attempt.testTitle] as const,
          ),
        ),
      ].map(([id, title]) => ({ id, title })),
    [orderedHistory],
  );

  const activeTestId = selectedTestId ?? testOptions[0]?.id ?? null;

  const chartAttempts = useMemo(
    () =>
      orderedHistory
        .filter(
          (attempt) =>
            attempt.testId === activeTestId && attempt.percentage !== null,
        )
        .reverse(),
    [orderedHistory, activeTestId],
  );

  const chartPoints = chartAttempts.map((attempt, index) => {
    const x =
      chartAttempts.length === 1
        ? 340
        : 60 + (560 * index) / (chartAttempts.length - 1);

    const percent = Math.max(0, Math.min(100, attempt.percentage ?? 0));

    return {
      x,
      y: 178 - percent * 1.5,
      attempt,
    };
  });

  return (
    <div className="ka-dashboard">
      {analytics.warnings.length > 0 && (
        <div className="ka-warnings" role="status">
          <AlertCircle size={19} />

          <div>
            <strong>Важливо про результати</strong>

            {analytics.warnings.map((warning, index) => (
              <p key={index}>{warning}</p>
            ))}
          </div>
        </div>
      )}

      <StudentAnalyticsOverview analytics={analytics} viewer={viewer} />

      <AnalyticsCollapsibleSection
        title="Навчальні теми"
        description="Перегляньте свої результати за темами курсу."
        countLabel={countLabel(topics.length, ["тема", "теми", "тем"])}
        defaultOpen
      >
        {!analytics.hasCurrentTopics ? (
          <div className="ka-empty">
            Навчальні теми потребують оновлення. Поки що перегляньте результати
            за поняттями нижче.
          </div>
        ) : topics.length === 0 ? (
          <div className="ka-empty">Навчальні теми поки не сформовано.</div>
        ) : (
          <div className="ka-topic-list">
            {topics.map((topic) => {
              const hasResult =
                topic.observedMasteryPercent !== null &&
                topic.dataStatus !== "NoData";

              return (
                <div key={topic.topicId} className="ka-topic-item">
                  <div className="ka-topic-top">
                    <h3>{topic.name}</h3>

                    <strong>
                      {hasResult
                        ? formatAnalyticsPercent(topic.observedMasteryPercent)
                        : "Ще не оцінено"}
                    </strong>
                  </div>

                  <AnalyticsProgress
                    value={topic.observedMasteryPercent}
                    status={topic.dataStatus}
                  />

                  <div className="ka-topic-meta">
                    <span>
                      Оцінено {topic.assessedConcepts} із {topic.totalConcepts}{" "}
                      понять
                    </span>

                    <span>{getAnalyticsDataStatusLabel(topic.dataStatus)}</span>
                  </div>

                  {hasResult && (
                    <small className="ka-topic-explanation">
                      Результат за поняттями, які вже перевірялися
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AnalyticsCollapsibleSection>

      <AnalyticsCollapsibleSection
        title="Результати за поняттями"
        description="Дізнайтеся, які поняття вже перевірялися в тестах."
        countLabel={countLabel(concepts.length, [
          "поняття",
          "поняття",
          "понять",
        ])}
      >
        {chartConcepts.length === 0 ? (
          <div className="ka-empty">
            Поки немає результатів за окремими поняттями. Вони з'являться після
            проходження тестів, питання яких пов'язані з графом знань.
          </div>
        ) : (
          <div className="ka-concept-chart">
            <h3>Результати за перевіреними поняттями</h3>

            {chartConcepts.map((concept) => (
              <div key={concept.conceptId} className="ka-concept-chart-row">
                <button
                  type="button"
                  className="ka-concept-chart-name"
                  onClick={() => setSelectedConceptId(concept.conceptId)}
                >
                  {concept.name}
                </button>

                <AnalyticsProgress
                  value={concept.observedMasteryPercent}
                  status={concept.dataStatus}
                />

                <strong>
                  {formatAnalyticsPercent(concept.observedMasteryPercent)}
                </strong>

                {concept.dataStatus === "Limited" && (
                  <span className="ka-chart-limited">Попередньо</span>
                )}
              </div>
            ))}

            <p className="ka-muted">
              Показано до 10 понять із найнижчими результатами. Повний список
              наведено нижче.
            </p>
          </div>
        )}

        <div className="ka-table-tools">
          <label className="ka-search">
            <Search size={17} />

            <input
              type="search"
              value={conceptSearch}
              placeholder="Знайти поняття..."
              aria-label="Пошук навчального поняття"
              onChange={(event) => setConceptSearch(event.target.value)}
            />
          </label>

          <select
            className="ka-select"
            aria-label="Сортування понять"
            value={conceptSort}
            onChange={(event) =>
              setConceptSort(event.target.value as ConceptSort)
            }
          >
            <option value="name">За назвою</option>
            <option value="lowest">Найнижчий результат</option>
            <option value="highest">Найвищий результат</option>
            <option value="questions">Найбільше питань</option>
          </select>
        </div>

        {filteredConcepts.length === 0 ? (
          <div className="ka-empty">Понять за таким запитом не знайдено.</div>
        ) : (
          <div
            className={`ka-concepts-layout ${
              selectedConcept ? "ka-concepts-layout--detail" : ""
            }`}
          >
            <div className="ka-table-scroll">
              <table className="ka-table">
                <thead>
                  <tr>
                    <th>Поняття</th>
                    <th>Результат</th>
                    <th>Питань</th>
                    <th>Статус результату</th>
                    <th>Повторення</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredConcepts.map((concept) => {
                    const hasResult =
                      concept.dataStatus !== "NoData" &&
                      concept.observedMasteryPercent !== null;

                    return (
                      <tr key={concept.conceptId}>
                        <td>
                          <button
                            type="button"
                            className="ka-table-concept-button"
                            onClick={() =>
                              setSelectedConceptId(concept.conceptId)
                            }
                          >
                            {concept.name}
                            <ChevronRight size={15} />
                          </button>
                        </td>

                        <td>
                          {hasResult
                            ? formatAnalyticsPercent(
                                concept.observedMasteryPercent,
                              )
                            : "—"}
                        </td>

                        <td>{concept.questionsCount}</td>

                        <td>
                          <span
                            className={`ka-status ka-status--${concept.dataStatus.toLowerCase()}`}
                          >
                            {getAnalyticsDataStatusLabel(concept.dataStatus)}
                          </span>
                        </td>

                        <td>
                          {getReviewPriorityLabel(concept.reviewPriority)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedConcept && (
              <aside className="ka-concept-detail">
                <div className="ka-detail-heading">
                  <div>
                    <span className="ka-eyebrow">Навчальне поняття</span>
                    <h3>{selectedConcept.name}</h3>
                  </div>

                  <button
                    type="button"
                    aria-label="Закрити деталі поняття"
                    onClick={() => setSelectedConceptId(null)}
                  >
                    <X size={19} />
                  </button>
                </div>

                {selectedConcept.description && (
                  <p>{selectedConcept.description}</p>
                )}

                <div className="ka-detail-result">
                  <strong>
                    {selectedConcept.dataStatus === "NoData"
                      ? "Не оцінено"
                      : formatAnalyticsPercent(
                          selectedConcept.observedMasteryPercent,
                        )}
                  </strong>

                  <span>
                    {getAnalyticsDataStatusLabel(selectedConcept.dataStatus)}
                  </span>
                </div>

                <div className="ka-detail-stats">
                  <div>
                    <span>Питань</span>
                    <strong>{selectedConcept.questionsCount}</strong>
                  </div>

                  <div>
                    <span>Відповідей</span>
                    <strong>{selectedConcept.answeredQuestionsCount}</strong>
                  </div>

                  <div>
                    <span>Правильних</span>
                    <strong>{selectedConcept.correctAnswersCount}</strong>
                  </div>

                  <div>
                    <span>Тестів</span>
                    <strong>{selectedConcept.testsCount}</strong>
                  </div>
                </div>

                <div className="ka-detail-block">
                  <h4>Що варто знати перед цим</h4>

                  {selectedConcept.prerequisiteRiskPercent !== null ? (
                    <p>
                      Оцінений ризик через недостатньо засвоєні передумови:{" "}
                      <strong>
                        {formatAnalyticsPercent(
                          selectedConcept.prerequisiteRiskPercent,
                        )}
                      </strong>
                    </p>
                  ) : (
                    <p>
                      Поки немає даних про можливі труднощі з базовими поняттями
                    </p>
                  )}

                  {selectedConcept.weakPrerequisiteConceptIds.length > 0 && (
                    <div className="ka-prerequisites">
                      <strong>Поняття, які варто повторити раніше:</strong>

                      {selectedConcept.weakPrerequisiteConceptIds.map((id) => (
                        <span key={id}>
                          {conceptsById.get(id)?.name ?? "Пов'язане поняття"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ka-detail-block">
                  <h4>Навчальні матеріали</h4>

                  <AnalyticsMaterials
                    courseId={courseId}
                    materials={selectedConcept.materials}
                  />
                </div>
              </aside>
            )}
          </div>
        )}
      </AnalyticsCollapsibleSection>

      <AnalyticsCollapsibleSection
        title="Рекомендуємо повторити"
        description="Матеріали, які можуть допомогти покращити результати."
        countLabel={countLabel(recommendations.length, [
          "рекомендація",
          "рекомендації",
          "рекомендацій",
        ])}
        defaultOpen
      >
        {recommendations.length === 0 ? (
          <div className="ka-empty">
            Поки немає персональних рекомендацій для повторення.
          </div>
        ) : (
          <div className="ka-recommendations">
            {recommendations.map((recommendation) => (
              <article
                key={recommendation.conceptId}
                className="ka-recommendation"
              >
                <div className="ka-recommendation-top">
                  <h3>{recommendation.conceptName}</h3>

                  <span
                    className={`ka-priority ka-priority--${recommendation.priority.toLowerCase()}`}
                  >
                    {getRecommendationPriorityLabel(recommendation.priority)}
                  </span>
                </div>

                <p>{recommendation.reason}</p>

                <div className="ka-recommendation-score">
                  <span>Результат за поняттям</span>
                  <strong>
                    {formatAnalyticsPercent(
                      recommendation.observedMasteryPercent,
                    )}
                  </strong>
                </div>

                <h4>Матеріали для повторення</h4>

                <AnalyticsMaterials
                  courseId={courseId}
                  materials={recommendation.materials}
                />
              </article>
            ))}
          </div>
        )}
      </AnalyticsCollapsibleSection>

      <AnalyticsCollapsibleSection
        title="Мої результати тестів"
        description="Перегляньте попередні проходження та зміну результатів."
        countLabel={countLabel(attemptHistory.length, [
          "спроба",
          "спроби",
          "спроб",
        ])}
      >
        {orderedHistory.length === 0 ? (
          <div className="ka-empty">
            {viewer === "teacher"
              ? "Студент ще не завершив жодного тесту в цьому курсі."
              : "Ви ще не завершили жодного тесту в цьому курсі."}
          </div>
        ) : (
          <>
            <div className="ka-history-controls">
              <label htmlFor="ka-history-test">Динаміка за тестом</label>

              <select
                id="ka-history-test"
                className="ka-select"
                value={activeTestId ?? ""}
                onChange={(event) =>
                  setSelectedTestId(Number(event.target.value))
                }
              >
                {testOptions.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title}
                  </option>
                ))}
              </select>
            </div>

            {chartPoints.length > 0 && (
              <div className="ka-history-chart">
                <svg
                  viewBox="0 0 680 225"
                  role="img"
                  aria-label="Динаміка результатів за вибраним тестом"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <title>Динаміка результатів тестування</title>

                  {[0, 25, 50, 75, 100].map((percent) => {
                    const y = 178 - percent * 1.5;

                    return (
                      <g key={percent}>
                        <line
                          x1="52"
                          x2="635"
                          y1={y}
                          y2={y}
                          stroke="#e5e7eb"
                          strokeDasharray="4 5"
                        />

                        <text
                          x="40"
                          y={y + 4}
                          textAnchor="end"
                          fontSize="11"
                          fill="#9ca3af"
                        >
                          {percent}%
                        </text>
                      </g>
                    );
                  })}

                  {chartPoints.length > 1 && (
                    <polyline
                      points={chartPoints
                        .map((point) => `${point.x},${point.y}`)
                        .join(" ")}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {chartPoints.map((point, index) => (
                    <g key={point.attempt.attemptId}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="5.5"
                        fill="#4f46e5"
                        stroke="white"
                        strokeWidth="2"
                      >
                        <title>
                          {formatAnalyticsDate(point.attempt.completedAtUtc)}
                          {" — "}
                          {formatAnalyticsPercent(point.attempt.percentage)}
                        </title>
                      </circle>

                      {(chartPoints.length <= 6 ||
                        index % Math.ceil(chartPoints.length / 6) === 0) && (
                        <text
                          x={point.x}
                          y="207"
                          textAnchor="middle"
                          fontSize="11"
                          fill="#6b7280"
                        >
                          {new Date(
                            point.attempt.completedAtUtc,
                          ).toLocaleDateString("uk-UA", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>

                <p className="ka-muted">
                  Порівняйте свої результати за різні спроби проходження цього
                  тесту.
                </p>
              </div>
            )}

            <div className="ka-table-scroll">
              <table className="ka-table">
                <thead>
                  <tr>
                    <th>Тест</th>
                    <th>Дата завершення</th>
                    <th>Результат</th>
                    <th>Дані для аналізу знань</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {orderedHistory.map((attempt) => (
                    <tr key={attempt.attemptId}>
                      <td>{attempt.testTitle}</td>

                      <td>{formatAnalyticsDate(attempt.completedAtUtc)}</td>

                      <td>{formatAnalyticsPercent(attempt.percentage)}</td>

                      <td>
                        {attempt.hasKnowledgeSnapshot
                          ? "Враховано в аналітиці"
                          : "Без аналізу понять"}
                      </td>

                      <td>
                        <Link
                          to={
                            viewer === "teacher"
                              ? `/attempts/${attempt.attemptId}/details`
                              : `/attempts/${attempt.attemptId}/review`
                          }
                          className="ka-table-link"
                        >
                          Переглянути
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AnalyticsCollapsibleSection>

      <div className="ka-calculated-at">
        Дані оновлено: {formatAnalyticsDate(analytics.calculatedAtUtc)}
      </div>
    </div>
  );
}
