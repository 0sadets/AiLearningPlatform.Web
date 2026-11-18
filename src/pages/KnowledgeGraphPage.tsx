import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  Plus,
  RefreshCw,
  ChevronDown,
MoreHorizontal,
Trash2,
  Search,
  Sparkles,
} from "lucide-react";

import { getCourseById, getCourseMaterials } from "../api/coursesApi";

import {
  createKnowledgeConcept,
  createKnowledgeRelation,
  deleteKnowledgeConcept,
  deleteKnowledgeRelation,
  enrichKnowledgeRelations,
  generateKnowledgeGraph,
  generateKnowledgeTopics,
  getKnowledgeGraph,
  getKnowledgeGraphSourceStatus,
  getKnowledgeTopics,
  updateKnowledgeConcept,
  updateKnowledgeRelation,
  createKnowledgeTopic,
  updateKnowledgeTopic,
  deleteKnowledgeTopic,
  deleteKnowledgeGraph,
} from "../api/knowledgeGraphApi";

import { useToast } from "../context/ToastContext";

import type { CourseDetails } from "../types/course";
import type { CourseMaterial } from "../types/courseMaterial";

import {
  KnowledgeRelationType,
  type CourseKnowledgeGraphDto,
  type CourseKnowledgeTopicsDto,
  type CreateKnowledgeConceptDto,
  type CreateKnowledgeRelationDto,
  type CreateKnowledgeTopicDto,
  type KnowledgeGraphSelection,
  type KnowledgeGraphSourceStatusDto,
  type KnowledgeGraphViewMode,
} from "../types/knowledgeGraph";

import { getKnowledgeGraphError, RELATION_INFO } from "../utils/knowledgeGraph";

import KnowledgeGraphCanvas from "../components/knowledge-graph/KnowledgeGraphCanvas";
import KnowledgeGraphDetailsPanel from "../components/knowledge-graph/KnowledgeGraphDetailsPanel";
import GraphGenerationDialog from "../components/knowledge-graph/GraphGenerationDialog";

import KnowledgeConceptDialog from "../components/knowledge-graph/KnowledgeConceptDialog";

import KnowledgeGraphConfirmDialog from "../components/knowledge-graph/KnowledgeGraphConfirmDialog";
import KnowledgeRelationDialog from "../components/knowledge-graph/KnowledgeRelationDialog";
import KnowledgeTopicDialog from "../components/knowledge-graph/KnowledgeTopicDialog";

import KnowledgeTopicDeleteDialog from "../components/knowledge-graph/KnowledgeTopicDeleteDialog";
import KnowledgeGraphDeleteDialog from "../components/knowledge-graph/KnowledgeGraphDeleteDialog";

import "../styles/knowledge-graph.css";

type BusyAction =
  | "graph"
  | "topics"
  | "relations"
  | "concept-save"
  | "concept-delete"
  | "relation-save"
  | "relation-delete"
  | "topic-save"
  | "topic-delete"
  | "graph-delete"
  | null;

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

  const [mode, setMode] = useState<KnowledgeGraphViewMode>("topics");

  const [selected, setSelected] = useState<KnowledgeGraphSelection>(null);

  const [isConceptFocusEnabled, setConceptFocusEnabled] =
  useState(false);

  const [search, setSearch] = useState("");

  const [relationFilter, setRelationFilter] =
    useState<KnowledgeRelationType | null>(null);

  const [busyAction, setBusyAction] = useState<BusyAction>(null);

  const [isGraphActionsOpen, setGraphActionsOpen] =
  useState(false);

const [isDeleteGraphDialogOpen, setDeleteGraphDialogOpen] =
  useState(false);

const graphActionsRef = useRef<HTMLDivElement>(null);

  // ---------- РЕДАГУВАННЯ ПОНЯТЬ ----------

  const [conceptEditor, setConceptEditor] = useState<
    { kind: "create" } | { kind: "edit"; id: number } | null
  >(null);

  const [deletingConceptId, setDeletingConceptId] = useState<number | null>(
    null,
  );
  // ---------- РЕДАГУВАННЯ ЗВ'ЯЗКІВ ----------

  const [relationEditor, setRelationEditor] = useState<
    { kind: "create" } | { kind: "edit"; id: number } | null
  >(null);

  const [deletingRelationId, setDeletingRelationId] = useState<number | null>(
    null,
  );

  const [topicEditor, setTopicEditor] = useState<
    { kind: "create" } | { kind: "edit"; id: number } | null
  >(null);

  const [deletingTopicId, setDeletingTopicId] = useState<number | null>(null);

  // Генерація графа
  const [isGenerationDialogOpen, setGenerationDialogOpen] = useState(false);

  const [materials, setMaterials] = useState<CourseMaterial[]>([]);

  const [areMaterialsLoading, setMaterialsLoading] = useState(false);

  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);

  // Підтвердження перезапису ручних змін тем
  const [showOverwriteConfirmation, setShowOverwriteConfirmation] =
    useState(false);

  const isOwner = course?.isOwner === true;
  const isBusy = busyAction !== null;

  const focusedConceptId =
  mode === "relations" &&
  isConceptFocusEnabled &&
  selected?.kind === "concept"
    ? selected.id
    : null;

  const editingConcept =
    conceptEditor?.kind === "edit"
      ? (graph?.concepts.find((item) => item.id === conceptEditor.id) ?? null)
      : null;

  const deletingConcept =
    deletingConceptId !== null
      ? (graph?.concepts.find((item) => item.id === deletingConceptId) ?? null)
      : null;

  const editingRelation =
    relationEditor?.kind === "edit"
      ? (graph?.relations.find((item) => item.id === relationEditor.id) ?? null)
      : null;

  const deletingRelation =
    deletingRelationId !== null
      ? (graph?.relations.find((item) => item.id === deletingRelationId) ??
        null)
      : null;

  const editingTopic =
    topicEditor?.kind === "edit"
      ? (topics?.topics.find((item) => item.id === topicEditor.id) ?? null)
      : null;

  const deletingTopic =
    deletingTopicId !== null
      ? (topics?.topics.find((item) => item.id === deletingTopicId) ?? null)
      : null;
  // ---------- КЕРУВАННЯ ПОНЯТТЯМИ ----------

  const handleOpenCreateConcept = () => {
    if (!isOwner || isBusy || !graph) {
      return;
    }

    setConceptEditor({
      kind: "create",
    });
  };

  const handleOpenEditConcept = (conceptId: number) => {
    if (!isOwner || isBusy || !graph) {
      return;
    }

    const exists = graph.concepts.some((item) => item.id === conceptId);

    if (!exists) {
      return;
    }

    setConceptEditor({
      kind: "edit",
      id: conceptId,
    });
  };

  const handleOpenDeleteConcept = (conceptId: number) => {
    if (!isOwner || isBusy || !graph) {
      return;
    }

    const exists = graph.concepts.some((item) => item.id === conceptId);

    if (!exists) {
      return;
    }

    setDeletingConceptId(conceptId);
  };

  // ---------- ЗБЕРЕЖЕННЯ ПОНЯТТЯ ----------

  const handleSaveConcept = async (dto: CreateKnowledgeConceptDto) => {
    if (!isOwner || isBusy || !graph || conceptEditor === null) {
      throw new Error("Операція зараз недоступна.");
    }

    const isEditing = conceptEditor.kind === "edit";

    setBusyAction("concept-save");

    try {
      let savedConceptId: number;

      if (conceptEditor.kind === "edit") {
        savedConceptId = conceptEditor.id;

        await updateKnowledgeConcept(courseId, conceptEditor.id, {
          name: dto.name,
          description: dto.description,
        });
      } else {
        const result = await createKnowledgeConcept(courseId, dto);

        savedConceptId = result.id;
      }

      const freshTopics = await refreshGraphData();

      if (!freshTopics?.isCurrent) {
        setMode("relations");
      }

      // Закриваємо форму
      setConceptEditor(null);

      // Вибираємо збережене поняття на графі
      setSelected({
        kind: "concept",
        id: savedConceptId,
      });

      showToast(
        isEditing ? "Поняття успішно оновлено." : "Поняття успішно додано.",
        "success",
      );
    } finally {
      setBusyAction(null);
    }
  };

  // ---------- ВИДАЛЕННЯ ПОНЯТТЯ ----------

  const handleDeleteConcept = async () => {
    if (!isOwner || isBusy || !graph || deletingConceptId === null) {
      return;
    }

    const conceptId = deletingConceptId;

    setBusyAction("concept-delete");

    try {
      await deleteKnowledgeConcept(courseId, conceptId);

      await refreshGraphData();

      setConceptFocusEnabled(false);

      setSelected((current) =>
        current?.kind === "concept" && current.id === conceptId
          ? null
          : current,
      );

      setDeletingConceptId(null);

      showToast("Поняття та пов'язані з ним зв'язки видалено.", "success");
    } catch (error) {
      showToast(
        getKnowledgeGraphError(error, "Не вдалося видалити поняття."),
        "error",
      );
    } finally {
      setBusyAction(null);
    }
  };

  // ---------- КЕРУВАННЯ СЕМАНТИЧНИМИ ЗВ'ЯЗКАМИ ----------

  const handleOpenCreateRelation = () => {
    if (!isOwner || isBusy || !graph || graph.concepts.length < 2) {
      return;
    }

    setRelationEditor({
      kind: "create",
    });
  };

  const handleOpenEditRelation = (relationId: number) => {
    if (!isOwner || isBusy || !graph) {
      return;
    }

    const exists = graph.relations.some((item) => item.id === relationId);

    if (!exists) {
      return;
    }

    setRelationEditor({
      kind: "edit",
      id: relationId,
    });
  };

  const handleOpenDeleteRelation = (relationId: number) => {
    if (!isOwner || isBusy || !graph) {
      return;
    }

    const exists = graph.relations.some((item) => item.id === relationId);

    if (!exists) {
      return;
    }

    setDeletingRelationId(relationId);
  };

  // ---------- ЗБЕРЕЖЕННЯ ЗВ'ЯЗКУ ----------

  const handleSaveRelation = async (dto: CreateKnowledgeRelationDto) => {
    if (!isOwner || isBusy || !graph || relationEditor === null) {
      throw new Error("Операція зараз недоступна.");
    }

    const isEditing = relationEditor.kind === "edit";

    setBusyAction("relation-save");

    try {
      let savedRelationId: number;

      if (relationEditor.kind === "edit") {
        savedRelationId = relationEditor.id;

        await updateKnowledgeRelation(courseId, relationEditor.id, dto);
      } else {
        const result = await createKnowledgeRelation(courseId, dto);

        savedRelationId = result.id;
      }

      // Отримуємо актуальні поняття, зв'язки та теми
      await refreshGraphData();

      // Показуємо режим семантичних зв'язків
      setMode("relations");

      // Прибираємо фільтрацію, щоб нове відношення
      // гарантовано було видно на полотні
      setRelationFilter(null);

      // Закриваємо форму
      setRelationEditor(null);

      // Виділяємо створений або оновлений зв'язок
      setSelected({
        kind: "relation",
        id: savedRelationId,
      });

      showToast(
        isEditing
          ? "Семантичний зв'язок успішно оновлено."
          : "Семантичний зв'язок успішно додано.",
        "success",
      );
    } finally {
      setBusyAction(null);
    }
  };

  // ---------- ВИДАЛЕННЯ ЗВ'ЯЗКУ ----------

  const handleDeleteRelation = async () => {
    if (!isOwner || isBusy || !graph || deletingRelationId === null) {
      return;
    }

    const relationId = deletingRelationId;

    setBusyAction("relation-delete");

    try {
      await deleteKnowledgeRelation(courseId, relationId);

      // Завантажуємо актуальну структуру графа
      await refreshGraphData();

      // Прибираємо виділення видаленого ребра
      setSelected((current) =>
        current?.kind === "relation" && current.id === relationId
          ? null
          : current,
      );

      setDeletingRelationId(null);

      showToast("Семантичний зв'язок успішно видалено.", "success");
    } catch (error) {
      showToast(
        getKnowledgeGraphError(
          error,
          "Не вдалося видалити семантичний зв'язок.",
        ),
        "error",
      );
    } finally {
      setBusyAction(null);
    }
  };

  // ---------- ЗАВАНТАЖЕННЯ ГРАФА ----------

  const refreshGraphData = useCallback(async () => {
    let graphData: CourseKnowledgeGraphDto;

    try {
      graphData = await getKnowledgeGraph(courseId);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setGraph(null);
        setTopics(null);
        setSourceStatus(null);
        return;
      }

      throw error;
    }

    const [topicsResult, sourceResult] = await Promise.allSettled([
      getKnowledgeTopics(courseId),
      getKnowledgeGraphSourceStatus(courseId),
    ]);

    setGraph(graphData);

    const freshTopics =
      topicsResult.status === "fulfilled" ? topicsResult.value : null;

    setTopics(freshTopics);

    setSourceStatus(
      sourceResult.status === "fulfilled" ? sourceResult.value : null,
    );

    return freshTopics;
  }, [courseId]);

  const refreshTopicsData = useCallback(async () => {
    const data = await getKnowledgeTopics(courseId);

    setTopics(data);

    return data;
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
            getKnowledgeGraphError(error, "Не вдалося завантажити граф знань."),
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

  useEffect(() => {
  if (!isGraphActionsOpen) {
    return;
  }

  const handleOutsideClick = (event: PointerEvent) => {
    if (
      event.target instanceof Node &&
      !graphActionsRef.current?.contains(event.target)
    ) {
      setGraphActionsOpen(false);
    }
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setGraphActionsOpen(false);
    }
  };

  document.addEventListener("pointerdown", handleOutsideClick);
  document.addEventListener("keydown", handleEscape);

  return () => {
    document.removeEventListener("pointerdown", handleOutsideClick);
    document.removeEventListener("keydown", handleEscape);
  };
}, [isGraphActionsOpen]);

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

      const availableIds = new Set(data.map((item) => item.id));

      const previousIds = sourceStatus?.sourceMaterialIds ?? [];

      setSelectedMaterialIds(
        previousIds.filter((id) => availableIds.has(id)).slice(0, 5),
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

      setConceptFocusEnabled(false);

      showToast(
        `Граф сформовано. Опрацьовано ${result.processedChunksCount} фрагментів матеріалів.`,
        "success",
      );
    } catch (error) {
      showToast(
        getKnowledgeGraphError(error, "Не вдалося згенерувати граф знань."),
        "error",
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleGenerateTopics = async (overwriteManualChanges = false) => {
    if (!isOwner || isBusy || !graph) {
      return;
    }

    setBusyAction("topics");

    try {
      await generateKnowledgeTopics(courseId, overwriteManualChanges);

      await refreshGraphData();

      setShowOverwriteConfirmation(false);
      setSelected(null);

      showToast("Навчальні теми успішно сформовано.", "success");
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
    if (!isOwner || isBusy || !graph || !topics?.isCurrent) {
      return;
    }

    setBusyAction("relations");

    try {
      const result = await enrichKnowledgeRelations(courseId);

      await refreshGraphData();

      if (result.relationsAdded === 0) {
        showToast("Нових підтверджених зв'язків не знайдено.", "success");
      } else {
        showToast(
          `Додано ${result.relationsAdded} зв'язків. Ізольованих понять: ${result.isolatedConceptsBefore} → ${result.isolatedConceptsAfter}.`,
          "success",
        );
      }
    } catch (error) {
      showToast(
        getKnowledgeGraphError(error, "Не вдалося виконати пошук зв'язків."),
        "error",
      );
    } finally {
      setBusyAction(null);
    }
  };

  // ---------- КЕРУВАННЯ НАВЧАЛЬНИМИ ТЕМАМИ ----------

  const handleOpenCreateTopic = () => {
    if (
      !isOwner ||
      isBusy ||
      !graph ||
      !topics?.isCurrent ||
      graph.concepts.length === 0
    ) {
      return;
    }

    setTopicEditor({ kind: "create" });
  };

  const handleOpenEditTopic = (topicId: number) => {
    if (!isOwner || isBusy || !topics?.isCurrent) {
      return;
    }

    if (!topics.topics.some((item) => item.id === topicId)) {
      return;
    }

    setTopicEditor({
      kind: "edit",
      id: topicId,
    });
  };

  const handleOpenDeleteTopic = (topicId: number) => {
    if (!isOwner || isBusy || !topics?.isCurrent || topics.topics.length <= 1) {
      return;
    }

    if (!topics.topics.some((item) => item.id === topicId)) {
      return;
    }

    setDeletingTopicId(topicId);
  };

  const handleSaveTopic = async (dto: CreateKnowledgeTopicDto) => {
    if (
      !isOwner ||
      isBusy ||
      !graph ||
      !topics?.isCurrent ||
      topicEditor === null
    ) {
      throw new Error("Операція зараз недоступна.");
    }

    const isEditing = topicEditor.kind === "edit";

    setBusyAction("topic-save");

    try {
      const savedTopic =
        topicEditor.kind === "edit"
          ? await updateKnowledgeTopic(courseId, topicEditor.id, dto)
          : await createKnowledgeTopic(courseId, dto);

      setTopicEditor(null);
      setMode("topics");

      setSelected({
        kind: "topic",
        id: savedTopic.id,
      });

      try {
        await refreshTopicsData();

        showToast(
          isEditing
            ? "Навчальну тему успішно оновлено."
            : "Навчальну тему успішно створено.",
          "success",
        );
      } catch {
        showToast(
          "Тему збережено, але не вдалося оновити список тем. Перезавантажте сторінку.",
          "error",
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteTopic = async (transferToTopicId?: number) => {
    if (
      !isOwner ||
      isBusy ||
      !topics?.isCurrent ||
      deletingTopicId === null ||
      topics.topics.length <= 1
    ) {
      return;
    }

    const topicId = deletingTopicId;

    setBusyAction("topic-delete");

    try {
      await deleteKnowledgeTopic(courseId, topicId, transferToTopicId);

      setDeletingTopicId(null);

      setSelected((current) =>
        current?.kind === "topic" && current.id === topicId ? null : current,
      );

      try {
        await refreshTopicsData();

        showToast("Навчальну тему успішно видалено.", "success");
      } catch {
        showToast(
          "Тему видалено, але не вдалося оновити список тем. Перезавантажте сторінку.",
          "error",
        );
      }
    } catch (error) {
      showToast(
        getKnowledgeGraphError(error, "Не вдалося видалити навчальну тему."),
        "error",
      );
    } finally {
      setBusyAction(null);
    }
  };

  // ---------- ВИДАЛЕННЯ ГРАФА ----------

const handleOpenDeleteGraph = () => {
  if (!isOwner || isBusy || !graph) {
    return;
  }

  setGraphActionsOpen(false);
  setDeleteGraphDialogOpen(true);
};

const handleDeleteGraph = async () => {
  if (!isOwner || isBusy || !graph) {
    return;
  }

  setBusyAction("graph-delete");

  try {
    await deleteKnowledgeGraph(courseId);

    setGraph(null);
    setTopics(null);
    setSourceStatus(null);

    setSelected(null);
    setMode("topics");
    setConceptFocusEnabled(false);

    setSearch("");
    setRelationFilter(null);

    setConceptEditor(null);
    setDeletingConceptId(null);

    setRelationEditor(null);
    setDeletingRelationId(null);

    setTopicEditor(null);
    setDeletingTopicId(null);

    setShowOverwriteConfirmation(false);
    setGraphActionsOpen(false);
    setDeleteGraphDialogOpen(false);

    showToast(
      "Граф знань успішно видалено.",
      "success",
    );
  } catch (error) {
    showToast(
      getKnowledgeGraphError(
        error,
        "Не вдалося видалити граф знань.",
      ),
      "error",
    );
  } finally {
    setBusyAction(null);
  }
};

  const searchMatches = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("uk-UA");

    if (!query || !graph) {
      return [];
    }

    return graph.concepts
      .filter((concept) =>
        concept.name.toLocaleLowerCase("uk-UA").includes(query),
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

const handleGraphSelection = (
  nextSelection: KnowledgeGraphSelection,
) => {
  setSelected(nextSelection);

  if (nextSelection?.kind !== "concept") {
    setConceptFocusEnabled(false);
  }
};

const changeMode = (nextMode: KnowledgeGraphViewMode) => {
  setMode(nextMode);
  setSelected(null);
  setConceptFocusEnabled(false);
};

const handleToggleConceptFocus = () => {
  if (
    mode !== "relations" ||
    selected?.kind !== "concept"
  ) {
    return;
  }

  setConceptFocusEnabled((current) => !current);
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
        <Link to={`/courses/${courseId}`} className="back-link">
          <ArrowLeft size={16} />
          Назад до курсу
        </Link>

        <div className="form-error">{pageError ?? "Курс не знайдено."}</div>
      </div>
    );
  }

  return (
    <div className="page kg-page">
      <Link to={`/courses/${courseId}`} className="back-link kg-back-link">
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
            Інтерактивна карта навчальних понять, тематичних груп та семантичних
            зв'язків.
          </p>
        </div>

       {isOwner && (
  <div className="kg-page-actions">
    {graph && (
      <div
        className="kg-graph-actions"
        ref={graphActionsRef}
      >
        <button
          type="button"
          className="secondary-button kg-more-button"
          disabled={isBusy}
          aria-expanded={isGraphActionsOpen}
          aria-controls="kg-graph-actions-menu"
          onClick={() =>
            setGraphActionsOpen((current) => !current)
          }
        >
          <MoreHorizontal size={18} />
          Дії
          <ChevronDown size={15} />
        </button>

        {isGraphActionsOpen && (
          <div
            id="kg-graph-actions-menu"
            className="kg-graph-actions-menu"
          >
            <button
              type="button"
              className="kg-graph-actions-danger"
              onClick={handleOpenDeleteGraph}
            >
              <Trash2 size={17} />
              Видалити граф знань
            </button>
          </div>
        )}
      </div>
    )}

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
  </div>
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
              {graph ? "Актуалізуємо граф знань..." : "Генеруємо граф знань..."}
            </strong>

            <p>
              Аналізуємо навчальні матеріали, визначаємо ключові поняття та
              зв'язки між ними. Це може зайняти деякий час.
            </p>

            {graph && (
              <span>
                Поточна версія графа залишатиметься доступною до завершення
                генерації.
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

                {sourceStatus && sourceStatus.missingMaterialIds.length > 0 && (
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
                  className={mode === "topics" ? "active" : ""}
                  aria-pressed={mode === "topics"}
                  onClick={() => changeMode("topics")}
                >
                  <Layers3 size={17} />
                  Теми
                </button>

                <button
                  type="button"
                  className={mode === "relations" ? "active" : ""}
                  aria-pressed={mode === "relations"}
                  onClick={() => changeMode("relations")}
                >
                  <GitBranch size={17} />
                  Семантичні зв'язки
                </button>
              </div>

              {isOwner && (
                <div className="kg-workspace-actions">
                  <button
                    type="button"
                    className="secondary-button kg-button-with-icon"
                    onClick={handleOpenCreateConcept}
                    disabled={isBusy}
                  >
                    <Plus size={16} />
                    Додати поняття
                  </button>

                  {mode === "topics" && (
                    <button
                      type="button"
                      className="secondary-button kg-button-with-icon"
                      onClick={handleOpenCreateTopic}
                      disabled={
                        isBusy ||
                        !topics?.isCurrent ||
                        graph.concepts.length === 0
                      }
                      title={
                        !topics?.isCurrent
                          ? "Спочатку актуалізуйте навчальні теми"
                          : "Створити нову навчальну тему"
                      }
                    >
                      <Plus size={16} />
                      Додати тему
                    </button>
                  )}

                  {mode === "topics" && (
                    <button
                      type="button"
                      className="secondary-button kg-button-with-icon"
                      onClick={() => void handleGenerateTopics()}
                      disabled={isBusy || graph.concepts.length === 0}
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
                      onClick={handleOpenCreateRelation}
                      disabled={isBusy || graph.concepts.length < 2}
                      title={
                        graph.concepts.length < 2
                          ? "Для створення зв'язку потрібні щонайменше два поняття"
                          : "Створити новий семантичний зв'язок"
                      }
                    >
                      <Plus size={16} />
                      Додати зв'язок
                    </button>
                  )}
                  {mode === "relations" && (
                    <button
                      type="button"
                      className="secondary-button kg-button-with-icon"
                      onClick={() => void handleEnrichRelations()}
                      disabled={isBusy || !topics?.isCurrent}
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
                    onChange={(event) => setSearch(event.target.value)}
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
                          onClick={() => selectSearchResult(concept.id)}
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
                        : (Number(value) as KnowledgeRelationType),
                    );

                    setSelected(null);
                  }}
                >
                  <option value="all">Усі типи зв'язків</option>

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

                <h3>Тематична структура потребує оновлення</h3>

                <p>
                  Поняття графа доступні в режимі семантичних зв'язків. Щоб
                  переглянути їх за темами, необхідно актуалізувати тематичну
                  структуру.
                </p>

                {isOwner && (
                  <button
                    type="button"
                    className="primary-button"
                    disabled={isBusy || graph.concepts.length === 0}
                    onClick={() => void handleGenerateTopics()}
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
  focusedConceptId={focusedConceptId}
  onSelect={handleGraphSelection}
/>

                <KnowledgeGraphDetailsPanel
                  graph={graph}
                  topics={topics}
                  selected={selected}
                  onSelect={handleGraphSelection}
                  mode={mode}
                  isConceptFocusEnabled={focusedConceptId !== null}
                  onToggleConceptFocus={handleToggleConceptFocus}
                  isOwner={isOwner}
                  isBusy={isBusy}
                  onEditConcept={handleOpenEditConcept}
                  onDeleteConcept={handleOpenDeleteConcept}
                  onEditRelation={handleOpenEditRelation}
                  onDeleteRelation={handleOpenDeleteRelation}
                  onEditTopic={handleOpenEditTopic}
                  onDeleteTopic={handleOpenDeleteTopic}
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
                Використовуйте колесо миші для масштабування та перетягування
                полотна.
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

      <KnowledgeGraphDeleteDialog
  isOpen={isDeleteGraphDialogOpen}
  graph={graph}
  topics={topics}
  isProcessing={busyAction === "graph-delete"}
  onClose={() => setDeleteGraphDialogOpen(false)}
  onConfirm={() => void handleDeleteGraph()}
/>
      {/* Створення та редагування поняття */}

      {graph && (
        <KnowledgeConceptDialog
          isOpen={conceptEditor !== null}
          concept={editingConcept}
          graph={graph}
          topics={topics}
          isBusy={isBusy}
          onClose={() => setConceptEditor(null)}
          onSave={handleSaveConcept}
        />
      )}

      {/* Підтвердження видалення поняття */}

      <KnowledgeGraphConfirmDialog
        isOpen={deletingConcept !== null}
        title="Видалити поняття?"
        description={
          deletingConcept
            ? `Видалити поняття «${deletingConcept.name}»? Пов'язані з ним семантичні зв'язки також будуть видалені. Цю дію не можна скасувати.`
            : ""
        }
        confirmLabel="Видалити поняття"
        isProcessing={busyAction === "concept-delete"}
        onCancel={() => setDeletingConceptId(null)}
        onConfirm={() => void handleDeleteConcept()}
      />
{graph && topics && (
  <KnowledgeTopicDialog
    isOpen={topicEditor !== null}
    graph={graph}
    topics={topics}
    topic={editingTopic}
    isBusy={isBusy}
    onClose={() => setTopicEditor(null)}
    onSave={handleSaveTopic}
  />
)}

{graph && topics && (
  <KnowledgeTopicDeleteDialog
    isOpen={deletingTopic !== null}
    graph={graph}
    topics={topics}
    topic={deletingTopic}
    isProcessing={busyAction === "topic-delete"}
    onClose={() => setDeletingTopicId(null)}
    onDelete={handleDeleteTopic}
  />
)}
      {/* Створення та редагування зв'язку */}

      {graph && (
        <KnowledgeRelationDialog
          isOpen={relationEditor !== null}
          graph={graph}
          relation={editingRelation}
          isBusy={isBusy}
          onClose={() => setRelationEditor(null)}
          onSave={handleSaveRelation}
        />
      )}

      {/* Підтвердження видалення зв'язку */}

      <KnowledgeGraphConfirmDialog
        isOpen={deletingRelation !== null}
        title="Видалити семантичний зв'язок?"
        description={
          deletingRelation
            ? "Вибраний семантичний зв'язок буде видалено з графа. Під час наступної AI-генерації система може знайти та створити його повторно."
            : ""
        }
        confirmLabel="Видалити зв'язок"
        isProcessing={busyAction === "relation-delete"}
        onCancel={() => setDeletingRelationId(null)}
        onConfirm={() => void handleDeleteRelation()}
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
                <h2 id="kg-overwrite-title">Перезаписати ручні зміни?</h2>

                <p>У графі є навчальні теми, які раніше редагувалися вручну.</p>
              </div>
            </div>

            <div className="kg-modal-body">
              <p>
                Повторна AI-генерація може замінити внесені викладачем зміни
                тематичної структури. Продовжити?
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isBusy}
                  onClick={() => setShowOverwriteConfirmation(false)}
                >
                  Скасувати
                </button>

                <button
                  type="button"
                  className="primary-button"
                  disabled={isBusy}
                  onClick={() => void handleGenerateTopics(true)}
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
