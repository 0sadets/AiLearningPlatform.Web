import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpenCheck,
  ClipboardList,
  LayoutDashboard,
  Search,
  Users,
  X,
} from "lucide-react";

import AnalyticsCollapsibleSection from "./AnalyticsCollapsibleSection";

import type {
  AnalyticsDataStatus,
  TeacherKnowledgeAnalyticsDto,
} from "../../types/knowledgeAnalytics";

import {
  formatAnalyticsDate,
  formatAnalyticsPercent,
  getAnalyticsDataStatusLabel,
  getAnalyticsScoreColor,
} from "../../utils/knowledgeAnalytics";

interface Props {
  courseId: number;
  analytics: TeacherKnowledgeAnalyticsDto;
  testNames: Record<number, string>;
}

type Tab = "overview" | "topics" | "students" | "questions";
type ConceptSort = "name" | "lowest" | "highest" | "students";
type StudentSort = "name" | "result" | "tests" | "difficulty";

type QuestionFilter =
  | "all"
  | "answered"
  | "errors"
  | "review"
  | "unanswered";

const tabs = [
  { key: "overview", label: "Огляд", icon: LayoutDashboard },
  { key: "topics", label: "Теми та поняття", icon: BookOpenCheck },
  { key: "students", label: "Студенти", icon: Users },
  { key: "questions", label: "Аналіз питань", icon: ClipboardList },
] as const;

function compareNullable(
  a: number | null,
  b: number | null,
  ascending: boolean,
): number {
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;

  return ascending ? a - b : b - a;
}

function ResultBar({
  value,
  status,
}: {
  value: number | null;
  status: AnalyticsDataStatus;
}) {
  return (
    <div
      className={`ka-progress-track ${
        status === "Limited" ? "ka-progress--limited" : ""
      }`}
      aria-label={
        value === null || status === "NoData"
          ? "Ще не оцінено"
          : formatAnalyticsPercent(value)
      }
    >
      {value !== null && status !== "NoData" && (
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

function explainWarning(warning: string): string {
  if (warning.includes("історичного знімка понять")) {
    return "Деякі попередні проходження враховані в загальних результатах тестів, але не в аналізі навчальних понять.";
  }

  return warning;
}

export default function TeacherKnowledgeDashboard({
  courseId,
  analytics,
  testNames,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [conceptSearch, setConceptSearch] = useState("");
  const [conceptSort, setConceptSort] =
    useState<ConceptSort>("lowest");
  const [selectedConceptId, setSelectedConceptId] =
    useState<number | null>(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentSort, setStudentSort] =
    useState<StudentSort>("name");

  const [questionSearch, setQuestionSearch] = useState("");
  const [questionFilter, setQuestionFilter] =
    useState<QuestionFilter>("all");
  const [selectedTest, setSelectedTest] = useState("all");
  const [selectedQuestionId, setSelectedQuestionId] =
    useState<number | null>(null);
  const [questionLimit, setQuestionLimit] = useState(20);

  const {
    summary,
    concepts,
    topics,
    students,
    questions,
    findings,
    warnings,
  } = analytics;

  const conceptById = useMemo(
    () =>
      new Map(
        concepts.map((concept) => [
          concept.conceptId,
          concept,
        ]),
      ),
    [concepts],
  );

  const selectedConcept = concepts.find(
    (concept) => concept.conceptId === selectedConceptId,
  );

  const selectedQuestion = questions.find(
    (question) => question.questionId === selectedQuestionId,
  );

  const conceptName = (id: number): string =>
    conceptById.get(id)?.name ?? "Поняття недоступне";

  const testName = (id: number): string =>
    testNames[id] ?? `Тест №${id}`;

  const filteredConcepts = useMemo(() => {
    const term = conceptSearch
      .trim()
      .toLocaleLowerCase("uk-UA");

    return concepts
      .filter((item) =>
        item.name.toLocaleLowerCase("uk-UA").includes(term),
      )
      .sort((a, b) => {
        if (conceptSort === "students") {
          return b.studentsAssessed - a.studentsAssessed;
        }

        if (conceptSort === "lowest") {
          return compareNullable(
            a.averageMasteryPercent,
            b.averageMasteryPercent,
            true,
          );
        }

        if (conceptSort === "highest") {
          return compareNullable(
            a.averageMasteryPercent,
            b.averageMasteryPercent,
            false,
          );
        }

        return a.name.localeCompare(b.name, "uk-UA");
      });
  }, [concepts, conceptSearch, conceptSort]);

  const filteredStudents = useMemo(() => {
    const term = studentSearch
      .trim()
      .toLocaleLowerCase("uk-UA");

    return students
      .filter((student) =>
        `${student.lastName} ${student.firstName}`
          .toLocaleLowerCase("uk-UA")
          .includes(term),
      )
      .sort((a, b) => {
        if (studentSort === "result") {
          return compareNullable(
            a.averageTestPercent,
            b.averageTestPercent,
            true,
          );
        }

        if (studentSort === "tests") {
          return b.completedTests - a.completedTests;
        }

        if (studentSort === "difficulty") {
          return (
            b.individualDifficultyCases -
            a.individualDifficultyCases
          );
        }

        return `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`,
          "uk-UA",
        );
      });
  }, [students, studentSearch, studentSort]);

  const questionTestIds = useMemo(
    () =>
      [...new Set(questions.map((question) => question.testId))]
        .sort((a, b) =>
          (testNames[a] ?? `Тест №${a}`).localeCompare(
            testNames[b] ?? `Тест №${b}`,
            "uk-UA",
          ),
        ),
    [questions, testNames],
  );

  const filteredQuestions = useMemo(() => {
    const term = questionSearch
      .trim()
      .toLocaleLowerCase("uk-UA");

    return questions
      .filter((question) => {
        if (
          selectedTest !== "all" &&
          question.testId !== Number(selectedTest)
        ) {
          return false;
        }

        if (
          !question.text
            .toLocaleLowerCase("uk-UA")
            .includes(term)
        ) {
          return false;
        }

        if (questionFilter === "answered") {
          return question.participantsCount > 0;
        }

        if (questionFilter === "errors") {
          return question.incorrectCount > 0;
        }

        if (questionFilter === "review") {
          return question.needsReview;
        }

        if (questionFilter === "unanswered") {
          return question.participantsCount === 0;
        }

        return true;
      })
      .sort(
        (a, b) =>
          compareNullable(
            a.errorPercent,
            b.errorPercent,
            false,
          ) ||
          b.participantsCount - a.participantsCount ||
          a.questionId - b.questionId,
      );
  }, [questions, questionSearch, questionFilter, selectedTest]);

  const participation =
    summary.enrolledStudents > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (summary.studentsWithCompletedTests /
              summary.enrolledStudents) *
              100,
          ),
        )
      : null;

  const findingsByKind = [
    { key: "GroupDifficulty", title: "Труднощі групи" },
    {
      key: "IndividualDifficulty",
      title: "Індивідуальні труднощі",
    },
    { key: "QuestionReview", title: "Питання для перегляду" },
  ] as const;

  return (
    <div className="tka-dashboard">
      {warnings.length > 0 && (
        <div className="ka-warnings" role="status">
          <span aria-hidden="true">ⓘ</span>

          <div>
            <strong>Про точність результатів</strong>

            {warnings.map((warning, index) => (
              <p key={index}>{explainWarning(warning)}</p>
            ))}
          </div>
        </div>
      )}

      <div
        className="tka-tabs"
        role="tablist"
        aria-label="Розділи аналітики курсу"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`tka-tab-${tab.key}`}
              aria-selected={activeTab === tab.key}
              className={`tka-tab ${
                activeTab === tab.key
                  ? "tka-tab--active"
                  : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`tka-panel-${activeTab}`}
        aria-labelledby={`tka-tab-${activeTab}`}
        className="tka-tab-panel"
      >
        {activeTab === "overview" && (
          <>
            <div className="tka-overview-grid">
              <section className="tka-participation">
                <div
                  className="tka-donut"
                  style={{
                    background:
                      participation === null
                        ? "#e5e7eb"
                        : `conic-gradient(
                            #6366f1 ${participation}%,
                            #e5e7eb ${participation}% 100%
                          )`,
                  }}
                  role="img"
                  aria-label={
                    participation === null
                      ? "Немає студентів"
                      : `Студенти, які завершили тест: ${formatAnalyticsPercent(participation)}`
                  }
                >
                  <div className="tka-donut-inner">
                    <strong>
                      {participation === null
                        ? "—"
                        : formatAnalyticsPercent(participation)}
                    </strong>

                    <span>взяли участь</span>
                  </div>
                </div>

                <div>
                  <h2>Участь у тестуванні</h2>

                  <p className="tka-lead">
                    {summary.studentsWithCompletedTests} із{" "}
                    {summary.enrolledStudents} студентів
                    завершили хоча б один тест.
                  </p>

                  <p className="ka-muted">
                    Це показник активності, а не
                    засвоєння навчального матеріалу.
                  </p>
                </div>
              </section>

              <div className="tka-mini-stats">
                <div>
                  <span>Середній результат тестів</span>
                  <strong>
                    {formatAnalyticsPercent(
                      summary.averageTestPercent,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Завершено спроб</span>
                  <strong>{summary.completedAttempts}</strong>
                </div>

                <div>
                  <span>Є результати за поняттями</span>
                  <strong>
                    {summary.assessedConcepts} із{" "}
                    {concepts.length}
                  </strong>
                </div>

                <div>
                  <span>Питань рекомендовано перевірити</span>
                  <strong>
                    {summary.questionsForReview}
                  </strong>
                </div>
              </div>
            </div>

            {summary.studentsWithCompletedTests === 1 && (
              <p className="tka-context-note">
                Поки результати тестування є лише для
                одного студента. Висновки щодо всієї
                групи робити зарано.
              </p>
            )}

            <AnalyticsCollapsibleSection
              title="Аналітичні висновки та рекомендації"
              description="Що можна покращити у навчанні за наявними результатами."
              countLabel={`${findings.length} висновків`}
              defaultOpen
            >
              {findings.length === 0 ? (
                <div className="ka-empty">
                  Поки немає висновків, які потребують
                  вашої уваги.
                </div>
              ) : (
                findingsByKind.map((group) => {
                  const items = findings.filter(
                    (item) => item.kind === group.key,
                  );

                  if (!items.length) return null;

                  return (
                    <div
                      className="tka-finding-group"
                      key={group.key}
                    >
                      <h3>{group.title}</h3>

                      <div className="tka-findings">
                        {items.map((finding, index) => (
                          <article
                            key={`${group.key}-${finding.conceptId ?? finding.questionId ?? finding.userId}-${index}`}
                            className="tka-finding"
                          >
                            <div className="tka-finding-top">
                              <h4>{finding.title}</h4>

                              <span
                                className={`tka-evidence ${
                                  finding.evidenceLevel ===
                                  "Preliminary"
                                    ? "tka-evidence--limited"
                                    : ""
                                }`}
                              >
                                {finding.evidenceLevel ===
                                "Preliminary"
                                  ? "Попередній висновок"
                                  : "Підтверджено порівнянням"}
                              </span>
                            </div>

                            <p>{finding.explanation}</p>

                            <p className="tka-action">
                              <strong>
                                Що можна зробити:
                              </strong>{" "}
                              {finding.recommendedAction}
                            </p>

                            {finding.userId !== null && (
                              <Link
                                to={`/courses/${courseId}/analytics/students/${finding.userId}`}
                              >
                                Переглянути результати студента
                              </Link>
                            )}
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </AnalyticsCollapsibleSection>

            <AnalyticsCollapsibleSection
              title="Навчальні поняття, за якими є результати"
              description="Короткий огляд оцінених понять. Деталі доступні у вкладці «Теми та поняття»."
              countLabel={`${summary.assessedConcepts} оцінено`}
            >
              <div className="tka-bar-list">
                {concepts.filter(
                  (item) =>
                    item.averageMasteryPercent !== null,
                ).length === 0 ? (
                  <div className="ka-empty">
                    Результатів за поняттями поки немає.
                  </div>
                ) : (
                  concepts
                    .filter(
                      (item) =>
                        item.averageMasteryPercent !== null,
                    )
                    .sort((a, b) =>
                      compareNullable(
                        a.averageMasteryPercent,
                        b.averageMasteryPercent,
                        true,
                      ),
                    )
                    .slice(0, 10)
                    .map((concept) => (
                      <div
                        key={concept.conceptId}
                        className="tka-bar-item"
                      >
                        <div className="tka-bar-title">
                          <strong>{concept.name}</strong>

                          <span>
                            {formatAnalyticsPercent(
                              concept.averageMasteryPercent,
                            )}
                          </span>
                        </div>

                        <ResultBar
                          value={concept.averageMasteryPercent}
                          status={concept.dataStatus}
                        />

                        <small>
                          {getAnalyticsDataStatusLabel(
                            concept.dataStatus,
                          )}{" "}
                          · {concept.studentsAssessed} студент(ів)
                        </small>
                      </div>
                    ))
                )}
              </div>

              <button
                type="button"
                className="tka-text-button"
                onClick={() => setActiveTab("topics")}
              >
                Переглянути всі поняття
              </button>
            </AnalyticsCollapsibleSection>
          </>
        )}

        {activeTab === "topics" && (
          <>
            <AnalyticsCollapsibleSection
              title="Навчальні теми"
              description="Середні результати лише за тими поняттями, які вже перевірялися."
              countLabel={`${topics.length} тем`}
              defaultOpen
            >
              {!analytics.hasCurrentTopics ? (
                <div className="ka-empty">
                  Навчальні теми потребують оновлення.
                  Дані за поняттями доступні нижче.
                </div>
              ) : topics.length === 0 ? (
                <div className="ka-empty">
                  Навчальні теми поки не сформовано.
                </div>
              ) : (
                <div className="tka-bar-list">
                  {topics.map((topic) => (
                    <div
                      key={topic.topicId}
                      className="tka-bar-item"
                    >
                      <div className="tka-bar-title">
                        <strong>{topic.name}</strong>

                        <span>
                          {formatAnalyticsPercent(
                            topic.averageMasteryPercent,
                          )}
                        </span>
                      </div>

                      <ResultBar
                        value={topic.averageMasteryPercent}
                        status={topic.dataStatus}
                      />

                      <small>
                        Оцінено {topic.assessedConcepts} із{" "}
                        {topic.totalConcepts} понять ·{" "}
                        {getAnalyticsDataStatusLabel(
                          topic.dataStatus,
                        )}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </AnalyticsCollapsibleSection>

            <AnalyticsCollapsibleSection
              title="Результати за поняттями"
              description="Знайдіть поняття, порівняйте результати й перегляньте деталі."
              countLabel={`${concepts.length} понять`}
              defaultOpen
            >
              <div className="ka-table-tools">
                <label className="ka-search">
                  <Search size={17} />

                  <input
                    type="search"
                    value={conceptSearch}
                    placeholder="Знайти поняття..."
                    aria-label="Пошук поняття"
                    onChange={(event) =>
                      setConceptSearch(event.target.value)
                    }
                  />
                </label>

                <select
                  className="ka-select"
                  aria-label="Сортування понять"
                  value={conceptSort}
                  onChange={(event) =>
                    setConceptSort(
                      event.target.value as ConceptSort,
                    )
                  }
                >
                  <option value="lowest">
                    Найнижчі результати
                  </option>
                  <option value="highest">
                    Найвищі результати
                  </option>
                  <option value="students">
                    Найбільше оцінених студентів
                  </option>
                  <option value="name">За назвою</option>
                </select>
              </div>

              {filteredConcepts.length === 0 ? (
                <div className="ka-empty">
                  За цим запитом понять не знайдено.
                </div>
              ) : (
                <div
                  className={`tka-table-and-detail ${
                    selectedConcept
                      ? "tka-table-and-detail--selected"
                      : ""
                  }`}
                >
                  <div className="ka-table-scroll">
                    <table className="ka-table">
                      <thead>
                        <tr>
                          <th>Поняття</th>
                          <th>Результат</th>
                          <th>Оцінено студентів</th>
                          <th>Статус</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredConcepts.map((concept) => (
                          <tr key={concept.conceptId}>
                            <td>
                              <button
                                type="button"
                                className="ka-table-concept-button"
                                onClick={() =>
                                  setSelectedConceptId(
                                    concept.conceptId,
                                  )
                                }
                              >
                                {concept.name}
                              </button>
                            </td>

                            <td>
                              {formatAnalyticsPercent(
                                concept.averageMasteryPercent,
                              )}
                            </td>

                            <td>
                              {concept.studentsAssessed}
                            </td>

                            <td>
                              <span
                                className={`ka-status ka-status--${concept.dataStatus.toLowerCase()}`}
                              >
                                {getAnalyticsDataStatusLabel(
                                  concept.dataStatus,
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedConcept && (
                    <aside className="tka-detail">
                      <div className="tka-detail-head">
                        <h3>{selectedConcept.name}</h3>

                        <button
                          type="button"
                          aria-label="Закрити деталі"
                          onClick={() =>
                            setSelectedConceptId(null)
                          }
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="tka-detail-value">
                        {formatAnalyticsPercent(
                          selectedConcept.averageMasteryPercent,
                        )}
                      </div>

                      <p>
                        {getAnalyticsDataStatusLabel(
                          selectedConcept.dataStatus,
                        )}
                      </p>

                      <dl>
                        <div>
                          <dt>Студентів з результатами</dt>
                          <dd>
                            {selectedConcept.studentsAssessed}
                          </dd>
                        </div>

                        <div>
                          <dt>Питань</dt>
                          <dd>
                            {selectedConcept.questionsCount}
                          </dd>
                        </div>
                      </dl>

                      {selectedConcept.hasGroupDifficulty ? (
                        <p className="tka-context-note">
                          Для цього поняття є сигнал про
                          труднощі групи. Перегляньте
                          висновки на вкладці «Огляд».
                        </p>
                      ) : (
                        <p className="ka-muted">
                          Підтвердженого сигналу про труднощі
                          групи немає.
                        </p>
                      )}
                    </aside>
                  )}
                </div>
              )}
            </AnalyticsCollapsibleSection>
          </>
        )}

        {activeTab === "students" && (
          <AnalyticsCollapsibleSection
            title="Результати студентів"
            description="Відкрийте персональну аналітику будь-якого учасника курсу."
            countLabel={`${students.length} студентів`}
            defaultOpen
          >
            <div className="ka-table-tools">
              <label className="ka-search">
                <Search size={17} />

                <input
                  type="search"
                  value={studentSearch}
                  placeholder="Знайти студента..."
                  aria-label="Пошук студента"
                  onChange={(event) =>
                    setStudentSearch(event.target.value)
                  }
                />
              </label>

              <select
                className="ka-select"
                aria-label="Сортування студентів"
                value={studentSort}
                onChange={(event) =>
                  setStudentSort(
                    event.target.value as StudentSort,
                  )
                }
              >
                <option value="name">
                  За прізвищем
                </option>
                <option value="result">
                  Найнижчий середній результат
                </option>
                <option value="tests">
                  Найбільше завершених тестів
                </option>
                <option value="difficulty">
                  Найбільше сигналів труднощів
                </option>
              </select>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="ka-empty">
                Студентів за таким запитом не знайдено.
              </div>
            ) : (
              <div className="ka-table-scroll">
                <table className="ka-table">
                  <thead>
                    <tr>
                      <th>Студент</th>
                      <th>Тестів завершено</th>
                      <th>Середній результат</th>
                      <th>Оцінено понять</th>
                      <th>Сигналів труднощів</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((student) => {
                      const studentName =
                        `${student.lastName} ${student.firstName}`;

                      return (
                        <tr key={student.userId}>
                          <td>
                            <strong>{studentName}</strong>
                          </td>

                          <td>{student.completedTests}</td>

                          <td>
                            {formatAnalyticsPercent(
                              student.averageTestPercent,
                            )}
                          </td>

                          <td>
                            {student.assessedConcepts}
                          </td>

                          <td>
                            {student.individualDifficultyCases}
                          </td>

                          <td>
                            <Link
                              className="ka-table-link"
                              to={`/courses/${courseId}/analytics/students/${student.userId}`}
                              state={{ studentName }}
                            >
                              Детальніше
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </AnalyticsCollapsibleSection>
        )}

        {activeTab === "questions" && (
          <AnalyticsCollapsibleSection
            title="Аналіз тестових питань"
            description="Перевірте питання, за якими є неправильні відповіді. Високий відсоток помилок сам по собі не означає, що питання складене неправильно."
            countLabel={`${questions.length} питань`}
            defaultOpen
          >
            <div className="tka-question-filters">
              <label className="ka-search">
                <Search size={17} />

                <input
                  type="search"
                  value={questionSearch}
                  placeholder="Пошук за текстом питання..."
                  aria-label="Пошук питання"
                  onChange={(event) => {
                    setQuestionSearch(event.target.value);
                    setQuestionLimit(20);
                  }}
                />
              </label>

              <select
                className="ka-select"
                aria-label="Фільтр за тестом"
                value={selectedTest}
                onChange={(event) => {
                  setSelectedTest(event.target.value);
                  setQuestionLimit(20);
                }}
              >
                <option value="all">Усі тести</option>

                {questionTestIds.map((id) => (
                  <option key={id} value={id}>
                    {testName(id)}
                  </option>
                ))}
              </select>

              <select
                className="ka-select"
                aria-label="Фільтр за результатами"
                value={questionFilter}
                onChange={(event) => {
                  setQuestionFilter(
                    event.target.value as QuestionFilter,
                  );
                  setQuestionLimit(20);
                }}
              >
                <option value="all">Усі питання</option>
                <option value="answered">
                  Є результати
                </option>
                <option value="errors">
                  Є неправильні відповіді
                </option>
                <option value="review">
                  Рекомендовано перевірити
                </option>
                <option value="unanswered">
                  Без результатів
                </option>
              </select>
            </div>

            <p className="tka-table-caption">
              Показано{" "}
              {Math.min(
                questionLimit,
                filteredQuestions.length,
              )}{" "}
              із {filteredQuestions.length} питань.
              Спочатку — найбільша частка помилок
              серед оцінених питань.
            </p>

            {filteredQuestions.length === 0 ? (
              <div className="ka-empty">
                Питань за вибраними умовами не знайдено.
              </div>
            ) : (
              <div
                className={`tka-table-and-detail ${
                  selectedQuestion
                    ? "tka-table-and-detail--selected"
                    : ""
                }`}
              >
                <div className="ka-table-scroll">
                  <table className="ka-table">
                    <thead>
                      <tr>
                        <th>Питання</th>
                        <th>Тест</th>
                        <th>Учасників</th>
                        <th>Помилок</th>
                        <th>Статус</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredQuestions
                        .slice(0, questionLimit)
                        .map((question) => (
                          <tr key={question.questionId}>
                            <td>
                              <button
                                type="button"
                                className="ka-table-concept-button tka-question-link"
                                onClick={() =>
                                  setSelectedQuestionId(
                                    question.questionId,
                                  )
                                }
                              >
                                {question.text}
                              </button>
                            </td>

                            <td>
                              {testName(question.testId)}
                            </td>

                            <td>
                              {question.participantsCount}
                            </td>

                            <td>
                              {formatAnalyticsPercent(
                                question.errorPercent,
                              )}
                            </td>

                            <td>
                              {question.needsReview ? (
                                <span className="ka-priority ka-priority--high">
                                  Перевірити
                                </span>
                              ) : question.participantsCount > 0 ? (
                                "Є результати"
                              ) : (
                                "Ще не оцінено"
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {filteredQuestions.length >
                    questionLimit && (
                    <button
                      type="button"
                      className="tka-load-more"
                      onClick={() =>
                        setQuestionLimit(
                          (count) => count + 20,
                        )
                      }
                    >
                      Показати ще 20 питань
                    </button>
                  )}
                </div>

                {selectedQuestion && (
                  <aside className="tka-detail">
                    <div className="tka-detail-head">
                      <h3>Деталі питання</h3>

                      <button
                        type="button"
                        aria-label="Закрити деталі питання"
                        onClick={() =>
                          setSelectedQuestionId(null)
                        }
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <p className="tka-question-full">
                      {selectedQuestion.text}
                    </p>

                    <p className="ka-muted">
                      {testName(selectedQuestion.testId)}
                    </p>

                    <div className="tka-detail-value">
                      {formatAnalyticsPercent(
                        selectedQuestion.errorPercent,
                      )}
                    </div>

                    <p>Частка неправильних відповідей</p>

                    <dl>
                      <div>
                        <dt>Учасників</dt>
                        <dd>
                          {selectedQuestion.participantsCount}
                        </dd>
                      </div>

                      <div>
                        <dt>Правильних відповідей</dt>
                        <dd>
                          {selectedQuestion.correctCount}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Неправильних, разом із пропусками
                        </dt>
                        <dd>
                          {selectedQuestion.incorrectCount}
                        </dd>
                      </div>

                      <div>
                        <dt>Із них пропущено</dt>
                        <dd>
                          {selectedQuestion.unansweredCount}
                        </dd>
                      </div>
                    </dl>

                    <h4>
                      Найчастіше вибрані неправильні варіанти
                    </h4>

                    {selectedQuestion.wrongOptions.some(
                      (option) => option.selectedCount > 0,
                    ) ? (
                      <div className="tka-wrong-options">
                        {selectedQuestion.wrongOptions
                          .filter(
                            (option) =>
                              option.selectedCount > 0,
                          )
                          .sort(
                            (a, b) =>
                              b.selectedCount -
                              a.selectedCount,
                          )
                          .map((option) => (
                            <div key={option.optionId}>
                              <p>{option.text}</p>
                              <strong>
                                {option.selectedCount} виборів
                              </strong>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="ka-muted">
                        Неправильні варіанти ще не обирали
                        або даних про них немає.
                      </p>
                    )}

                    <h4>Пов'язані поняття</h4>

                    {selectedQuestion.currentConceptIds.length >
                    0 ? (
                      <div className="tka-concept-tags">
                        {selectedQuestion.currentConceptIds.map(
                          (id) => (
                            <span key={id}>
                              {conceptName(id)}
                            </span>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="ka-muted">
                        Поняття ще не прив'язані.
                      </p>
                    )}

                    {selectedQuestion.historicalConceptIds
                      .length > 0 && (
                      <p className="ka-muted">
                        Поняття, враховані в завершених
                        спробах:{" "}
                        {selectedQuestion.historicalConceptIds
                          .map(conceptName)
                          .join(", ")}
                      </p>
                    )}

                    {selectedQuestion.errorContrastPercent !==
                      null && (
                      <p className="tka-context-note">
                        Відмінність частки помилок від
                        інших питань того самого поняття:{" "}
                        {formatAnalyticsPercent(
                          selectedQuestion.errorContrastPercent,
                        )}
                        .
                      </p>
                    )}

                    {selectedQuestion.needsReview && (
                      <p className="tka-context-note">
                        Аналітика рекомендує додатково
                        перевірити формулювання цього питання.
                      </p>
                    )}
                  </aside>
                )}
              </div>
            )}
          </AnalyticsCollapsibleSection>
        )}
      </div>

      <p className="ka-calculated-at">
        Дані оновлено:{" "}
        {formatAnalyticsDate(analytics.calculatedAtUtc)}
      </p>
    </div>
  );
}