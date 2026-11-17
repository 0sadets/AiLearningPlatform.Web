import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  GitBranch,
  Layers3,
  LoaderCircle,
  Network,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

import { getCourseById, getCourseMaterials } from "../api/coursesApi";

import {
  enrichKnowledgeRelations,
  generateKnowledgeGraph,
  generateKnowledgeTopics,
  getKnowledgeGraph,
  getKnowledgeGraphSourceStatus,
  getKnowledgeTopics,
} from "../api/knowledgeGraphApi";

import { useToast } from "../context/ToastContext";

import type { CourseDetails } from "../types/course";
import type { CourseMaterial } from "../types/courseMaterial";

import {
  KnowledgeRelationType,
  type CourseKnowledgeGraphDto,
  type CourseKnowledgeTopicsDto,
  type KnowledgeGraphSelection,
  type KnowledgeGraphSourceStatusDto,
  type KnowledgeGraphViewMode,
} from "../types/knowledgeGraph";

import {
  getKnowledgeGraphError,
  RELATION_INFO,
} from "../utils/knowledgeGraph";

import KnowledgeGraphCanvas from "../components/knowledge-graph/KnowledgeGraphCanvas";
import KnowledgeGraphDetailsPanel from "../components/knowledge-graph/KnowledgeGraphDetailsPanel";
import GraphGenerationDialog from "../components/knowledge-graph/GraphGenerationDialog";

import "../styles/knowledge-graph.css";

type BusyAction = "graph" | "topics" | "relations" | null;

export default function KnowledgeGraphPage() {
  const { courseId: courseIdParam } = useParams();
  const courseId = Number(courseIdParam);

  const { showToast } = useToast();

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [graph, setGraph] = useState<CourseKnowledgeGraphDto | null>(null);
  const [topics, setTopics] = useState<CourseKnowledgeTopicsDto | null>(null);

  const [sourceStatus, setSourceStatus] =
    useState<KnowledgeGraphSourceStatusDto | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [mode, setMode] =
    useState<KnowledgeGraphViewMode>("topics");

  const [selected, setSelected] =
    useState<KnowledgeGraphSelection>(null);

  const [search, setSearch] = useState("");

  const [relationFilter, setRelationFilter] =
    useState<KnowledgeRelationType | null>(null);

  const [busyAction, setBusyAction] =
    useState<BusyAction>(null);

  // Генерація графа
  const [isGenerationDialogOpen, setGenerationDialogOpen] =
    useState(false);

  const [materials, setMaterials] =
    useState<CourseMaterial[]>([]);

  const [areMaterialsLoading, setMaterialsLoading] =
    useState(false);

  const [selectedMaterialIds, setSelectedMaterialIds] =
    useState<number[]>([]);

  // Підтвердження перезапису ручних змін тем
  const [showOverwriteConfirmation, setShowOverwriteConfirmation] =
    useState(false);

  const isOwner = course?.isOwner === true;
  const isBusy = busyAction !== null;

  // ---------- ЗАВАНТАЖЕННЯ ГРАФА ----------

  const refreshGraphData = useCallback(async () => {
    let graphData: CourseKnowledgeGraphDto;

    try {
      graphData = await getKnowledgeGraph(courseId);
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 404
      ) {
        setGraph(null);
        setTopics(null);
        setSourceStatus(null);
        return;
      }

      throw error;
    }

    const [topicsResult, sourceResult] =
      await Promise.allSettled([
        getKnowledgeTopics(courseId),
        getKnowledgeGraphSourceStatus(courseId),
      ]);

    setGraph(graphData);

    setTopics(
      topicsResult.status === "fulfilled"
        ? topicsResult.value
        : null,
    );

    setSourceStatus(
      sourceResult.status === "fulfilled"
        ? sourceResult.value
        : null,
    );
  }, [courseId]);

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      setIsLoading(true);
      setPageError(null);

      if (!Number.isInteger(courseId) || courseId <= 0) {
        setPageError("Некоректний ідентифікатор курсу.");
        setIsLoading(false);
        return;
      }

      try {
        const courseData = await getCourseById(courseId);

        if (cancelled) {
          return;
        }

        setCourse(courseData);

        await refreshGraphData();
      } catch (error) {
        if (!cancelled) {
          setPageError(
            getKnowledgeGraphError(
              error,
              "Не вдалося завантажити граф знань.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [courseId, refreshGraphData]);

  // ---------- ВИБІР МАТЕРІАЛІВ ----------

  const openGenerationDialog = async () => {
    if (!isOwner || isBusy) {
      return;
    }

    setGenerationDialogOpen(true);
    setMaterialsLoading(true);

    try {
      const data = await getCourseMaterials(courseId);

      setMaterials(data);

      const availableIds = new Set(
        data.map((item) => item.id),
      );

      const previousIds =
        sourceStatus?.sourceMaterialIds ?? [];

      setSelectedMaterialIds(
        previousIds
          .filter((id) => availableIds.has(id))
          .slice(0, 5),
      );
    } catch (error) {
      setMaterials([]);
      setSelectedMaterialIds([]);

      showToast(
        getKnowledgeGraphError(
          error,
          "Не вдалося завантажити матеріали курсу.",
        ),
        "error",
      );
    } finally {
      setMaterialsLoading(false);
    }
  };

  const toggleMaterial = (id: number) => {
    setSelectedMaterialIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= 5) {
        return current;
      }

      return [...current, id];
    });
  };


  const handleGenerateGraph = async () => {
  if (
    !isOwner ||
    isBusy ||
    selectedMaterialIds.length === 0 ||
    selectedMaterialIds.length > 5
  ) {
    return;
  }

  setGenerationDialogOpen(false);

  setBusyAction("graph");

  try {
    const result = await generateKnowledgeGraph(courseId, {
      materialIds: selectedMaterialIds,
    });

    await refreshGraphData();

    setSelected(null);

    showToast(
      `Граф сформовано. Опрацьовано ${result.processedChunksCount} фрагментів матеріалів.`,
      "success",
    );
  } catch (error) {
    showToast(
      getKnowledgeGraphError(
        error,
        "Не вдалося згенерувати граф знань.",
      ),
      "error",
    );
  } finally {
    setBusyAction(null);
  }
};


  const handleGenerateTopics = async (
    overwriteManualChanges = false,
  ) => {
    if (!isOwner || isBusy || !graph) {
      return;
    }

    setBusyAction("topics");

    try {
      await generateKnowledgeTopics(
        courseId,
        overwriteManualChanges,
      );

      await refreshGraphData();

      setShowOverwriteConfirmation(false);
      setSelected(null);

      showToast(
        "Навчальні теми успішно сформовано.",
        "success",
      );
    } catch (error) {
      const message = getKnowledgeGraphError(
        error,
        "Не вдалося згенерувати навчальні теми.",
      );

      const hasManualChanges =
        axios.isAxiosError(error) &&
        [400, 409].includes(error.response?.status ?? 0) &&
        /ручн|manual/i.test(message);

      if (!overwriteManualChanges && hasManualChanges) {
        setShowOverwriteConfirmation(true);
      } else {
        showToast(message, "error");
      }
    } finally {
      setBusyAction(null);
    }
  };


  const handleEnrichRelations = async () => {
    if (
      !isOwner ||
      isBusy ||
      !graph ||
      !topics?.isCurrent
    ) {
      return;
    }

    setBusyAction("relations");

    try {
      const result =
        await enrichKnowledgeRelations(courseId);

      await refreshGraphData();

      if (result.relationsAdded === 0) {
        showToast(
          "Нових підтверджених зв'язків не знайдено.",
          "success",
        );
      } else {
        showToast(
          `Додано ${result.relationsAdded} зв'язків. Ізольованих понять: ${result.isolatedConceptsBefore} → ${result.isolatedConceptsAfter}.`,
          "success",
        );
      }
    } catch (error) {
      showToast(
        getKnowledgeGraphError(
          error,
          "Не вдалося виконати пошук зв'язків.",
        ),
        "error",
      );
    } finally {
      setBusyAction(null);
    }
  };


  const searchMatches = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("uk-UA");

    if (!query || !graph) {
      return [];
    }

    return graph.concepts
      .filter((concept) =>
        concept.name
          .toLocaleLowerCase("uk-UA")
          .includes(query),
      )
      .slice(0, 8);
  }, [search, graph]);

  const selectSearchResult = (id: number) => {
    if (mode === "topics" && !topics?.isCurrent) {
      setMode("relations");
    }

    setSelected({ kind: "concept", id });
    setSearch("");
  };

  const changeMode = (nextMode: KnowledgeGraphViewMode) => {
    setMode(nextMode);
    setSelected(null);
  };


  if (isLoading) {
    return (
      <div className="page kg-page">
        <div className="kg-loading">
          <RefreshCw size={28} className="kg-spin" />
          <p>Завантаження графа знань...</p>
        </div>
      </div>
    );
  }

  if (pageError || !course) {
    return (
      <div className="page kg-page">
        <Link
          to={`/courses/${courseId}`}
          className="back-link"
        >
          <ArrowLeft size={16} />
          Назад до курсу
        </Link>

        <div className="form-error">
          {pageError ?? "Курс не знайдено."}
        </div>
      </div>
    );
  }

  return (
    <div className="page kg-page">
      <Link
        to={`/courses/${courseId}`}
        className="back-link kg-back-link"
      >
        <ArrowLeft size={16} />
        Назад до курсу
      </Link>

      {/* Заголовок */}

      <div className="kg-page-header">
        <div>
          <span className="kg-eyebrow">
            <Network size={15} />
            {course.title}
          </span>

          <h1>Граф знань</h1>

          <p>
            Інтерактивна карта навчальних понять,
            тематичних груп та семантичних зв'язків.
          </p>
        </div>

        {isOwner && (
          <button
            type="button"
            className="primary-button kg-button-with-icon"
            onClick={() => void openGenerationDialog()}
            disabled={isBusy}
          >
            <Sparkles size={17} />
            {graph
              ? "Актуалізувати граф"
              : "Створити граф"}
          </button>
        )}
      </div>
{/* Індикатор генерації графа */}

{busyAction === "graph" && (
  <div
    className={`kg-generation-banner ${
      !graph ? "kg-generation-banner--initial" : ""
    }`}
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="kg-generation-banner-icon">
      <LoaderCircle size={27} className="kg-spin" />
    </div>

    <div className="kg-generation-banner-text">
      <strong>
        {graph
          ? "Актуалізуємо граф знань..."
          : "Генеруємо граф знань..."}
      </strong>

      <p>
        Аналізуємо навчальні матеріали, визначаємо
        ключові поняття та зв'язки між ними.
        Це може зайняти деякий час.
      </p>

      {graph && (
        <span>
          Поточна версія графа залишатиметься доступною
          до завершення генерації.
        </span>
      )}
    </div>
  </div>
)}
{/* Граф ще не створений */}

{!graph ? (
  busyAction === "graph" ? null : (
    <div className="kg-empty-graph">
          <div className="kg-empty-graph-icon">
            <Network size={34} />
          </div>

          <h2>Граф знань ще не створено</h2>

          <p>
            {isOwner
              ? "Створіть граф на основі навчальних матеріалів курсу, щоб автоматично виділити ключові поняття та зв'язки між ними."
              : "Викладач ще не сформував граф знань для цього курсу."}
          </p>

          {isOwner && (
            <button
              type="button"
              className="primary-button kg-button-with-icon"
              onClick={() => void openGenerationDialog()}
              disabled={isBusy}
            >
              <Sparkles size={17} />
              Створити граф знань
            </button>
          )}
               </div>
      )
      ) : (
        <>
          {/* Статуси */}

          <div className="kg-status-grid">
            <div
              className={`kg-status-card ${
                sourceStatus?.isSourceCurrent
                  ? "kg-status-card--success"
                  : "kg-status-card--warning"
              }`}
            >
              <div className="kg-status-icon">
                {sourceStatus?.isSourceCurrent ? (
                  <CheckCircle2 size={19} />
                ) : (
                  <AlertCircle size={19} />
                )}
              </div>

              <div>
                <strong>
                  {sourceStatus === null
                    ? "Стан джерел невідомий"
                    : sourceStatus.isSourceCurrent
                      ? "Джерела актуальні"
                      : "Матеріали змінилися"}
                </strong>

                <p>
                  {sourceStatus === null
                    ? "Не вдалося перевірити актуальність джерел."
                    : sourceStatus.isSourceCurrent
                      ? "Граф відповідає використаним навчальним матеріалам."
                      : "Матеріали змінилися після останньої генерації."}
                </p>

                {sourceStatus &&
                  sourceStatus.missingMaterialIds.length > 0 && (
                    <p className="kg-status-additional">
                      Видалені матеріали:{" "}
                      {sourceStatus.missingMaterialIds.join(", ")}
                    </p>
                  )}
              </div>
            </div>

            <div
              className={`kg-status-card ${
                topics?.isCurrent
                  ? "kg-status-card--success"
                  : "kg-status-card--warning"
              }`}
            >
              <div className="kg-status-icon">
                {topics?.isCurrent ? (
                  <CheckCircle2 size={19} />
                ) : (
                  <AlertCircle size={19} />
                )}
              </div>

              <div>
                <strong>
                  {topics === null
                    ? "Стан тем невідомий"
                    : topics.isCurrent
                      ? "Навчальні теми актуальні"
                      : "Теми потребують актуалізації"}
                </strong>

                <p>
                  {topics === null
                    ? "Не вдалося перевірити тематичну структуру."
                    : topics.isCurrent
                      ? `${topics.topicsCount} тем · ${topics.coveredConceptsCount} охоплених понять`
                      : "Згенеруйте або оновіть тематичну структуру графа."}
                </p>
              </div>
            </div>
          </div>

          {/* Основні показники */}

          <div className="kg-statistics">
            <div>
              <span>Поняття</span>
              <strong>{graph.concepts.length}</strong>
            </div>

            <div>
              <span>Зв'язки</span>
              <strong>{graph.relations.length}</strong>
            </div>

            <div>
              <span>Навчальні теми</span>
              <strong>{topics?.topicsCount ?? "—"}</strong>
            </div>

            <div>
              <span>Ревізія графа</span>
              <strong>#{graph.revision}</strong>
            </div>
          </div>

          {/* Робоча область */}

          <section className="kg-workspace">
            <div className="kg-workspace-header">
              <div className="kg-mode-switch">
                <button
                  type="button"
                  className={
                    mode === "topics" ? "active" : ""
                  }
                  aria-pressed={mode === "topics"}
                  onClick={() => changeMode("topics")}
                >
                  <Layers3 size={17} />
                  Теми
                </button>

                <button
                  type="button"
                  className={
                    mode === "relations" ? "active" : ""
                  }
                  aria-pressed={mode === "relations"}
                  onClick={() => changeMode("relations")}
                >
                  <GitBranch size={17} />
                  Семантичні зв'язки
                </button>
              </div>

              {isOwner && (
                <div className="kg-workspace-actions">
                  {mode === "topics" && (
                    <button
                      type="button"
                      className="secondary-button kg-button-with-icon"
                      onClick={() =>
                        void handleGenerateTopics()
                      }
                      disabled={
                        isBusy ||
                        graph.concepts.length === 0
                      }
                    >
                      <Sparkles size={16} />
                      {busyAction === "topics"
                        ? "Генерація..."
                        : topics?.isCurrent
                          ? "Перегенерувати теми"
                          : "Згенерувати теми"}
                    </button>
                  )}

                  {mode === "relations" && (
                    <button
                      type="button"
                      className="secondary-button kg-button-with-icon"
                      onClick={() =>
                        void handleEnrichRelations()
                      }
                      disabled={
                        isBusy || !topics?.isCurrent
                      }
                      title={
                        !topics?.isCurrent
                          ? "Спочатку актуалізуйте навчальні теми"
                          : "Знайти додаткові підтверджені зв'язки"
                      }
                    >
                      <Sparkles size={16} />

                      {busyAction === "relations"
                        ? "Пошук..."
                        : "Знайти додаткові зв'язки"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Пошук і фільтри */}

            <div className="kg-toolbar">
              <div className="kg-search-wrapper">
                <div className="kg-search">
                  <Search size={17} />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Пошук поняття..."
                    aria-label="Пошук поняття"
                  />
                </div>

                {search.trim() && (
                  <div className="kg-search-results">
                    {searchMatches.length === 0 ? (
                      <p>Понять не знайдено</p>
                    ) : (
                      searchMatches.map((concept) => (
                        <button
                          key={concept.id}
                          type="button"
                          onClick={() =>
                            selectSearchResult(concept.id)
                          }
                        >
                          {concept.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {mode === "relations" && (
                <select
                  className="kg-relation-filter"
                  value={relationFilter ?? "all"}
                  aria-label="Фільтр типу зв'язку"
                  onChange={(event) => {
                    const value = event.target.value;

                    setRelationFilter(
                      value === "all"
                        ? null
                        : (Number(
                            value,
                          ) as KnowledgeRelationType),
                    );

                    setSelected(null);
                  }}
                >
                  <option value="all">
                    Усі типи зв'язків
                  </option>

                  {Object.values(KnowledgeRelationType)
                    .filter(
                      (value): value is KnowledgeRelationType =>
                        typeof value === "number",
                    )
                    .map((type) => (
                      <option key={type} value={type}>
                        {RELATION_INFO[type].label}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {mode === "topics" && !topics?.isCurrent ? (
              <div className="kg-topics-unavailable">
                <Layers3 size={32} />

                <h3>
                  Тематична структура потребує оновлення
                </h3>

                <p>
                  Поняття графа доступні в режимі
                  семантичних зв'язків. Щоб переглянути
                  їх за темами, необхідно актуалізувати
                  тематичну структуру.
                </p>

                {isOwner && (
                  <button
                    type="button"
                    className="primary-button"
                    disabled={
                      isBusy ||
                      graph.concepts.length === 0
                    }
                    onClick={() =>
                      void handleGenerateTopics()
                    }
                  >
                    Згенерувати теми
                  </button>
                )}
              </div>
            ) : (
              <div className="kg-workspace-content">
                <KnowledgeGraphCanvas
                  graph={graph}
                  topics={topics}
                  mode={mode}
                  selected={selected}
                  search={search}
                  relationFilter={relationFilter}
                  onSelect={setSelected}
                />

                <KnowledgeGraphDetailsPanel
                  graph={graph}
                  topics={topics}
                  selected={selected}
                  onSelect={setSelected}
                />
              </div>
            )}

            <div className="kg-workspace-footer">
              <span>
                {mode === "topics"
                  ? "Зв'язки показують належність понять до навчальних тем."
                  : "Стрілки показують напрямок семантичних відношень."}
              </span>

              <span>
                Використовуйте колесо миші для масштабування
                та перетягування полотна.
              </span>
            </div>
          </section>
        </>
      )}

      {/* Генерація графа */}

      <GraphGenerationDialog
        isOpen={isGenerationDialogOpen}
        materials={materials}
        isLoading={areMaterialsLoading}
        isGenerating={busyAction === "graph"}
        selectedIds={selectedMaterialIds}
        hasExistingGraph={graph !== null}
        onToggle={toggleMaterial}
        onClose={() => setGenerationDialogOpen(false)}
        onGenerate={() => void handleGenerateGraph()}
      />

      {/* Перезапис ручних змін тем */}

      {showOverwriteConfirmation && (
        <div className="modal-overlay">
          <div
            className="modal-container kg-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kg-overwrite-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="kg-overwrite-title">
                  Перезаписати ручні зміни?
                </h2>

                <p>
                  У графі є навчальні теми, які раніше
                  редагувалися вручну.
                </p>
              </div>
            </div>

            <div className="kg-modal-body">
              <p>
                Повторна AI-генерація може замінити
                внесені викладачем зміни тематичної
                структури. Продовжити?
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isBusy}
                  onClick={() =>
                    setShowOverwriteConfirmation(false)
                  }
                >
                  Скасувати
                </button>

                <button
                  type="button"
                  className="primary-button"
                  disabled={isBusy}
                  onClick={() =>
                    void handleGenerateTopics(true)
                  }
                >
                  {busyAction === "topics"
                    ? "Генерація..."
                    : "Перезаписати й згенерувати"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}