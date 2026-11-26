import { useEffect, useRef, useState, type FormEvent } from "react";

import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import {
  Archive,
  ArrowLeft,
  ClipboardList,
  LockKeyhole,
  Plus,
  Save,
  Sparkles,
  LoaderCircle,
  Send,
  Trash2,
  AlertCircle,
} from "lucide-react";

import axios from "axios";

import {
  suggestQuestionKnowledgeConcepts,
  updateQuestionKnowledgeConcepts,
} from "../api/questionKnowledgeConceptsApi";

import { getKnowledgeGraph } from "../api/knowledgeGraphApi";

import type { KnowledgeGraphConceptDto } from "../types/knowledgeGraph";

import type { KnowledgeConceptsLoadStatus } from "../components/tests/QuestionKnowledgeConcepts";

import { getCourseById } from "../api/coursesApi";
import {
  createFullTest,
  updateTestDraft,
  getTestById,
  publishTest,
  archiveTest,
  deleteTest,
} from "../api/testsApi";

import { getTestQuestions } from "../api/testQuestionsApi";
import InlineQuestionEditor from "../components/tests/InlineQuestionEditor";
import TestDropdown from "../components/tests/TestDropdown";
import TestConfirmModal from "../components/tests/TestConfirmModal";
import TestSettingsForm from "../components/tests/TestSettingsForm";
import AiGenerationPanel from "../components/tests/AiGenerationPanel";

import type { AiGenerationResultDto } from "../types/aiGeneration";

import {
  mapAiQuestionToDraft,
  getQuestionDraftErrors,
  hasQuestionDraftErrors,
  type QuestionDraftErrors,
} from "../utils/testDraft";

import { normalizeKnowledgeConceptIds } from "../utils/testDraft";

import {
  getConstructorDraftKey,
  readConstructorDraft,
  saveConstructorDraft,
  removeConstructorDraft,
} from "../utils/testConstructorStorage";
import { useToast } from "../context/ToastContext";

import type { TestDto } from "../types/test";

import {
  buildFullTestPayload,
  createQuestionDraft,
  mapQuestionToDraft,
  synchronizeSavedQuestions,
  type QuestionDraft,
} from "../utils/testDraft";

import {
  getInitialTestSettings,
  getTestApiError,
  isUnauthorizedError,
  getTestSettingsErrors,
  type TestSettingsErrors,
  type TestSettingsValues,
} from "../utils/testForm";

import "../styles/test-editor.css";
import type { AiConceptSuggestionDraft } from "../types/questionKnowledgeConcepts";
function revalidateTouchedQuestionErrors(
  previous: QuestionDraftErrors,
  question: QuestionDraft,
): QuestionDraftErrors {
  const fresh = getQuestionDraftErrors(question);

  const updated: QuestionDraftErrors = {};

  if ("text" in previous) {
    updated.text = fresh.text;
  }

  if ("points" in previous) {
    updated.points = fresh.points;
  }

  if ("type" in previous) {
    updated.type = fresh.type;
  }

  if ("correct" in previous) {
    updated.correct = fresh.correct;
  }

  if ("optionsCount" in previous) {
    updated.optionsCount = fresh.optionsCount;
  }

  if (previous.options) {
    updated.options = {};

    for (const key of Object.keys(previous.options)) {
      if (!question.answerOptions.some((option) => option.key === key)) {
        continue;
      }

      updated.options[key] = fresh.options?.[key] ?? "";
    }
  }

  return updated;
}
type Action =
  | {
      kind: "publish" | "archive" | "deleteTest" | "removeAllQuestions";
    }
  | { kind: "removeQuestion"; key: string };

type Props = {
  mode: "create" | "edit";
};

const methodOptions = [
  {
    value: "manual",
    label: "Ручне створення",
  },
  {
    value: "ai",
    label: "Генерація з матеріалів через LearnAI",
  },
  {
    value: "import",
    label: "Імпорт із файлу",
    disabled: true,
  },
];

function snapshot(
  settings: TestSettingsValues,
  questions: QuestionDraft[],
): string {
  return JSON.stringify(buildFullTestPayload(settings, questions));
}
function sameConceptIds(first: number[], second: number[]): boolean {
  const a = [...normalizeKnowledgeConceptIds(first)].sort((x, y) => x - y);

  const b = [...normalizeKnowledgeConceptIds(second)].sort((x, y) => x - y);

  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function getConceptMatchingError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 429) {
      return "Перевищено ліміт AI-запитів. Спробуйте пізніше.";
    }

    if (status === 403) {
      return "У вас немає прав на виконання цієї дії.";
    }

    if (status === 400) {
      return getTestApiError(error, "Не вдалося виконати аналіз питань.");
    }

    return "Не вдалося автоматично визначити поняття. Повторіть спробу пізніше або встановіть прив'язки вручну.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Не вдалося автоматично визначити поняття.";
}

function confirmationDetails(action: Action) {
  switch (action.kind) {
    case "publish":
      return {
        title: "Опублікувати тест?",
        confirmLabel: "Опублікувати",
        danger: false,
        description:
          "Студенти отримають доступ до тесту. Після публікації змінювати питання й налаштування буде неможливо.",
      };
    case "removeAllQuestions":
      return {
        title: "Видалити всі питання?",
        confirmLabel: "Видалити всі",
        danger: true,
        description:
          "Усі питання будуть прибрані з конструктора, включно зі згенерованими LearnAI. Зміни застосуються до тесту після збереження чернетки.",
      };
    case "archive":
      return {
        title: "Архівувати тест?",
        confirmLabel: "Архівувати",
        danger: true,
        description:
          "Студенти не зможуть починати нові спроби. Архівація не видаляє результати й не має відновлення.",
      };

    case "deleteTest":
      return {
        title: "Видалити чернетку?",
        confirmLabel: "Видалити тест",
        danger: true,
        description:
          "Тест буде видалено назавжди. Backend дозволяє це лише для чернетки без спроб.",
      };

    case "removeQuestion":
      return {
        title: "Прибрати питання?",
        confirmLabel: "Прибрати",
        danger: true,
        description:
          "Питання зникне з форми. Зміна застосовується лише після збереження чернетки.",
      };
  }
}

function TestConstructorPage({ mode }: Props) {
  const { courseId: courseIdParam, testId: testIdParam } = useParams();

  const navigate = useNavigate();

  const location = useLocation();

  const { showToast } = useToast();

  const [test, setTest] = useState<TestDto | null>(null);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courseTitle, setCourseTitle] = useState("");

  const [knowledgeConcepts, setKnowledgeConcepts] = useState<
    KnowledgeGraphConceptDto[]
  >([]);

  const [knowledgeConceptsStatus, setKnowledgeConceptsStatus] =
    useState<KnowledgeConceptsLoadStatus>("loading");

  const [settings, setSettings] = useState<TestSettingsValues>(
    getInitialTestSettings,
  );

  const [creationMethod, setCreationMethod] = useState("manual");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  const [settingsErrors, setSettingsErrors] = useState<TestSettingsErrors>({});

  const [questionErrors, setQuestionErrors] = useState<
    Record<string, QuestionDraftErrors>
  >({});

  const [validationSubmitted, setValidationSubmitted] = useState(false);

  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const [importedJobIds, setImportedJobIds] = useState<string[]>([]);

  // Дозволяє записувати локальну чернетку тільки після її завантаження.
  const [draftReady, setDraftReady] = useState(false);

  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [scrollToQuestionKey, setScrollToQuestionKey] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [isMatchingConcepts, setIsMatchingConcepts] = useState(false);

  const [isSavingConcepts, setIsSavingConcepts] = useState(false);

  const [aiConceptSuggestions, setAiConceptSuggestions] = useState<
    Record<number, AiConceptSuggestionDraft>
  >({});

  const aiConceptOperationRef = useRef(false);

  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const draftStorageKey = courseId
    ? getConstructorDraftKey(courseId, mode === "edit" ? test?.id : undefined)
    : null;
  useEffect(() => {
    let active = true;

    const id = Number(mode === "create" ? courseIdParam : testIdParam);

    if (!Number.isSafeInteger(id) || id <= 0) {
      setLoadError(
        mode === "create" ? "Некоректний ID курсу." : "Некоректний ID тесту.",
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError("");
    setTest(null);
    setSavedSnapshot(null);
    setDraftReady(false);
    setAiConceptSuggestions({});
    setSettingsErrors({});
    setQuestionErrors({});
    setValidationSubmitted(false);
    async function load() {
      try {
        if (mode === "create") {
          const course = await getCourseById(id);

          if (!active) return;

          if (!course.isOwner) {
            setLoadError("Створювати тести може лише власник курсу.");
            return;
          }

          const key = getConstructorDraftKey(course.id);
          const restored = readConstructorDraft(key);

          setCourseId(course.id);
          setCourseTitle(course.title);

          setSettings(restored?.settings ?? getInitialTestSettings());

          setQuestions(restored?.questions ?? []);
          setCreationMethod(restored?.creationMethod ?? "manual");
          setImportedJobIds(restored?.importedJobIds ?? []);

          setExpandedKey(null);
          setDraftReady(true);
        } else {
          const loadedTest = await getTestById(id);
          const course = await getCourseById(loadedTest.courseId);

          if (!active) return;

          if (!course.isOwner) {
            setLoadError("Конструктор доступний лише власнику курсу.");
            return;
          }

          // Правильні відповіді отримуємо лише після перевірки власника.
          const items = await getTestQuestions(id);

          if (!active) return;

          const nextSettings = getInitialTestSettings(loadedTest);

          const nextQuestions = [...items]
            .sort((a, b) => a.order - b.order)
            .map(mapQuestionToDraft);

          const key = getConstructorDraftKey(course.id, loadedTest.id);

          const restored =
            !loadedTest.isPublished && !loadedTest.isArchived
              ? readConstructorDraft(key)
              : null;

          const hasUnsavedLocalChanges =
            restored !== null &&
            snapshot(restored.settings, restored.questions) !==
              snapshot(nextSettings, nextQuestions);

          setTest(loadedTest);
          setCourseId(course.id);
          setCourseTitle(course.title);

          setSettings(
            hasUnsavedLocalChanges && restored
              ? restored.settings
              : nextSettings,
          );

          setQuestions(
            hasUnsavedLocalChanges && restored
              ? restored.questions.map((question) => ({
                  ...question,
                  questionId: null,
                }))
              : nextQuestions,
          );

          setCreationMethod(restored?.creationMethod ?? "manual");
          setImportedJobIds(restored?.importedJobIds ?? []);

          setExpandedKey(null);

          setSavedSnapshot(snapshot(nextSettings, nextQuestions));

          setDraftReady(true);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            getTestApiError(error, "Не вдалося завантажити конструктор."),
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [mode, courseIdParam, testIdParam]);

  useEffect(() => {
    if (!courseId) {
      return;
    }

    let active = true;

    setKnowledgeConceptsStatus("loading");
    setKnowledgeConcepts([]);

    const loadConcepts = async () => {
      try {
        const graph = await getKnowledgeGraph(courseId);

        if (!active) {
          return;
        }

        setKnowledgeConcepts(graph.concepts);
        setKnowledgeConceptsStatus("ready");
      } catch (error) {
        if (!active) {
          return;
        }

        setKnowledgeConcepts([]);

        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setKnowledgeConceptsStatus("missing");
        } else {
          setKnowledgeConceptsStatus("error");
        }
      }
    };

    void loadConcepts();

    return () => {
      active = false;
    };
  }, [courseId]);

  useEffect(() => {
    if (!draftReady || !draftStorageKey || isLoading) return;

    if (test?.isPublished || test?.isArchived) return;

    saveConstructorDraft(draftStorageKey, {
      settings,
      questions,
      creationMethod,
      importedJobIds,
    });
  }, [
    draftReady,
    draftStorageKey,
    isLoading,
    test?.isPublished,
    test?.isArchived,
    settings,
    questions,
    creationMethod,
    importedJobIds,
  ]);
  const locked = !!test && (test.isPublished || test.isArchived);

  const isDirty =
    mode === "edit" &&
    savedSnapshot !== null &&
    snapshot(settings, questions) !== savedSnapshot;

  const totalPoints = questions.reduce(
    (sum, question) => sum + (Number(question.points) || 0),
    0,
  );

  const hasInvalidQuestions = questions.some((question) =>
    hasQuestionDraftErrors(getQuestionDraftErrors(question)),
  );

  const suggestionEntries = Object.entries(aiConceptSuggestions);

  const bulkConceptQuestionIds = Object.entries(aiConceptSuggestions).flatMap(
    ([key, suggestion]) => {
      const questionId = Number(key);

      const question = questions.find((item) => item.questionId === questionId);

      if (
        !question ||
        (question.knowledgeConceptIds?.length ?? 0) > 0 ||
        suggestion.selectedConceptIds.length === 0
      ) {
        return [];
      }

      return [questionId];
    },
  );

  const approvedSuggestionCount = suggestionEntries.filter(
    ([, suggestion]) => suggestion.approved,
  ).length;

  const hasAiConceptSuggestions = suggestionEntries.length > 0;

  const canUseAiConceptMatching =
    mode === "edit" &&
    test !== null &&
    !locked &&
    knowledgeConceptsStatus === "ready" &&
    knowledgeConcepts.length > 0 &&
    knowledgeConcepts.length <= 120 &&
    questions.length > 0;

  const showAiConceptOffer =
    mode === "edit" &&
    test !== null &&
    !locked &&
    knowledgeConceptsStatus === "ready" &&
    knowledgeConcepts.length > 0 &&
    !isDirty &&
    location.state !== null &&
    typeof location.state === "object" &&
    (
      location.state as {
        offerKnowledgeConcepts?: boolean;
      }
    ).offerKnowledgeConcepts === true;

  useEffect(() => {
    if (!scrollToQuestionKey) return;

    const element = document.getElementById(
      `test-question-${scrollToQuestionKey}`,
    );

    element?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setScrollToQuestionKey(null);
  }, [scrollToQuestionKey, expandedKey]);
  const backPath = courseId ? `/courses/${courseId}` : "/courses";

  function updateSettings(next: TestSettingsValues) {
    setSettings(next);

    setSettingsErrors((current) => {
      const fresh = getTestSettingsErrors(next);

      if (validationSubmitted) {
        return fresh;
      }

      const updated: TestSettingsErrors = {};

      for (const key of Object.keys(current) as (keyof TestSettingsErrors)[]) {
        updated[key] = fresh[key];
      }

      return updated;
    });
  }

  function validateSettingsField(field: keyof TestSettingsErrors) {
    const fresh = getTestSettingsErrors(settings);

    setSettingsErrors((current) => ({
      ...current,
      [field]: fresh[field],
    }));
  }

  function updateQuestion(key: string, question: QuestionDraft) {
    setQuestions((current) =>
      current.map((item) => (item.key === key ? question : item)),
    );

    if (question.questionId !== null) {
      setAiConceptSuggestions((current) => {
        if (!current[question.questionId!]) {
          return current;
        }

        const next = { ...current };
        delete next[question.questionId!];

        return next;
      });
    }

    setQuestionErrors((current) => {
      const previous = current[key];

      if (!validationSubmitted && !previous) {
        return current;
      }

      return {
        ...current,
        [key]: validationSubmitted
          ? getQuestionDraftErrors(question)
          : revalidateTouchedQuestionErrors(previous ?? {}, question),
      };
    });
  }

  function updateAiConceptSelection(questionId: number, conceptIds: number[]) {
    setAiConceptSuggestions((current) => {
      const suggestion = current[questionId];

      if (!suggestion) {
        return current;
      }

      return {
        ...current,
        [questionId]: {
          ...suggestion,
          selectedConceptIds: normalizeKnowledgeConceptIds(conceptIds),
          approved: false,
        },
      };
    });
  }

  function updateAiConceptApproval(questionId: number, approved: boolean) {
    setAiConceptSuggestions((current) => {
      const suggestion = current[questionId];

      if (!suggestion) {
        return current;
      }

      return {
        ...current,
        [questionId]: {
          ...suggestion,
          approved,
        },
      };
    });
  }

  function validateQuestionField(
    questionKey: string,
    field: keyof QuestionDraftErrors,
    optionKey?: string,
  ) {
    const question = questions.find((item) => item.key === questionKey);

    if (!question) return;

    const fresh = getQuestionDraftErrors(question);

    setQuestionErrors((current) => {
      const previous = current[questionKey] ?? {};

      if (field === "options" && optionKey) {
        return {
          ...current,
          [questionKey]: {
            ...previous,
            options: {
              ...previous.options,
              [optionKey]: fresh.options?.[optionKey] ?? "",
            },
          },
        };
      }

      return {
        ...current,
        [questionKey]: {
          ...previous,
          [field]: fresh[field],
        },
      };
    });
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;

    if (target < 0 || target >= questions.length) return;

    setQuestions((current) => {
      const next = [...current];

      [next[index], next[target]] = [next[target], next[index]];

      return next;
    });
  }

  function addQuestion() {
    const next = createQuestionDraft();

    setQuestions((current) => [...current, next]);
    setExpandedKey(next.key);
  }
  function handleImportAiQuestions(
    jobId: string,
    result: AiGenerationResultDto,
  ) {
    if (locked || isProcessing) return;

    if (importedJobIds.includes(jobId)) {
      showToast("Ці питання вже додані до конструктора.", "error");
      return;
    }

    setAiConceptSuggestions({});

    const newQuestions = result.questions.map(mapAiQuestionToDraft);

    const updatedQuestions = [...questions, ...newQuestions];

    const updatedJobIds = [...importedJobIds, jobId];

    if (draftStorageKey) {
      saveConstructorDraft(draftStorageKey, {
        settings,
        questions: updatedQuestions,
        creationMethod,
        importedJobIds: updatedJobIds,
      });
    }

    setQuestions(updatedQuestions);
    setImportedJobIds(updatedJobIds);

    if (validationSubmitted) {
      setQuestionErrors(
        Object.fromEntries(
          updatedQuestions.map((question) => [
            question.key,
            getQuestionDraftErrors(question),
          ]),
        ),
      );
    }

    if (newQuestions.length > 0) {
      setExpandedKey(newQuestions[0].key);
    }
  }

  async function handleSuggestKnowledgeConcepts() {
    if (
      !test ||
      !canUseAiConceptMatching ||
      isProcessing ||
      aiConceptOperationRef.current
    ) {
      return;
    }

    if (isDirty) {
      showToast(
        "Спочатку збережіть зміни в тесті, а потім запустіть автоматичне визначення понять.",
        "error",
      );
      return;
    }

    aiConceptOperationRef.current = true;
    setIsMatchingConcepts(true);
    setIsProcessing(true);

    try {
      const savedQuestions = [...(await getTestQuestions(test.id))].sort(
        (a, b) => a.order - b.order,
      );

      if (
        savedQuestions.length !== questions.length ||
        snapshot(settings, savedQuestions.map(mapQuestionToDraft)) !==
          snapshot(settings, questions)
      ) {
        throw new Error(
          "Збережена версія тесту відрізняється від відкритої. Оновіть сторінку перед запуском LearnAI.",
        );
      }

      const synchronized = synchronizeSavedQuestions(savedQuestions, questions);

      const questionIds = synchronized.map((question) => question.questionId);

      if (
        questionIds.some(
          (id) => id === null || !Number.isSafeInteger(id) || id <= 0,
        ) ||
        new Set(questionIds).size !== questionIds.length
      ) {
        throw new Error(
          "Не вдалося отримати актуальні питання тесту. Оновіть сторінку.",
        );
      }

      setQuestions(synchronized);

      const result = await suggestQuestionKnowledgeConcepts(test.id);

      const availableConceptIds = new Set(
        knowledgeConcepts.map((concept) => concept.id),
      );

      const validQuestionIds = new Set(questionIds as number[]);

      const seenQuestionIds = new Set<number>();

      const hasInvalidSuggestions =
        result.testId !== test.id ||
        result.suggestions.length !== synchronized.length ||
        result.suggestions.some((item) => {
          if (
            !validQuestionIds.has(item.questionId) ||
            seenQuestionIds.has(item.questionId) ||
            !Array.isArray(item.conceptIds) ||
            item.conceptIds.length > 3 ||
            item.conceptIds.some((id) => !availableConceptIds.has(id))
          ) {
            return true;
          }

          seenQuestionIds.add(item.questionId);
          return false;
        });

      if (hasInvalidSuggestions) {
        throw new Error(
          "Не вдалося правильно зіставити пропозиції з питаннями. Оновіть граф знань і повторіть аналіз.",
        );
      }

      const nextSuggestions: Record<number, AiConceptSuggestionDraft> = {};

      for (const item of result.suggestions) {
        const ids = normalizeKnowledgeConceptIds(item.conceptIds);

        nextSuggestions[item.questionId] = {
          recommendedConceptIds: ids,
          selectedConceptIds: [...ids],
          approved: false,
        };
      }

      setAiConceptSuggestions(nextSuggestions);

      const firstSuggestedQuestion = synchronized.find(
        (question) =>
          question.questionId !== null &&
          (nextSuggestions[question.questionId]?.recommendedConceptIds.length ??
            0) > 0,
      );

      if (firstSuggestedQuestion) {
        setExpandedKey(firstSuggestedQuestion.key);
        setScrollToQuestionKey(firstSuggestedQuestion.key);
      }

      const matchedCount = Object.values(nextSuggestions).filter(
        (item) => item.recommendedConceptIds.length > 0,
      ).length;

      showToast(
        matchedCount > 0
          ? "Поняття визначено. Перевірте пропозиції перед збереженням."
          : "LearnAI не знайшла достатньо точних відповідностей. Ви можете вибрати поняття вручну.",
        "success",
      );
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        showToast(getConceptMatchingError(error), "error");
      }
    } finally {
      aiConceptOperationRef.current = false;
      setIsMatchingConcepts(false);
      setIsProcessing(false);
    }
  }

  async function handleConfirmAiConcepts(
    suggestionsOverride?: typeof aiConceptSuggestions,
    onlyQuestionIds?: ReadonlySet<number>,
  ) {
    const suggestionsToSave = suggestionsOverride ?? aiConceptSuggestions;

    if (
      !test ||
      !canUseAiConceptMatching ||
      isProcessing ||
      aiConceptOperationRef.current
    ) {
      return;
    }

    if (isDirty) {
      showToast("Спочатку збережіть зміни в тесті.", "error");
      return;
    }

    const approved = Object.entries(suggestionsToSave)
      .filter(
        ([id, suggestion]) =>
          suggestion.approved &&
          (!onlyQuestionIds || onlyQuestionIds.has(Number(id))),
      )
      .map(([id, suggestion]) => ({
        questionId: Number(id),
        conceptIds: normalizeKnowledgeConceptIds(suggestion.selectedConceptIds),
      }));

    if (approved.length === 0) {
      showToast(
        "Оберіть питання, для яких потрібно підтвердити поняття.",
        "error",
      );
      return;
    }

    const currentQuestionsById = new Map(
      questions
        .filter((question) => question.questionId !== null)
        .map((question) => [question.questionId!, question]),
    );

    const availableConceptIds = new Set(
      knowledgeConcepts.map((concept) => concept.id),
    );

    const hasInvalidSelection = approved.some(
      (item) =>
        !currentQuestionsById.has(item.questionId) ||
        item.conceptIds.some((id) => !availableConceptIds.has(id)),
    );

    if (hasInvalidSelection) {
      showToast(
        "Деякі вибрані поняття більше недоступні. Перевірте пропозиції та повторіть спробу.",
        "error",
      );
      return;
    }

    const changes = approved.filter((item) => {
      const question = currentQuestionsById.get(item.questionId);

      return (
        question !== undefined &&
        !sameConceptIds(question.knowledgeConceptIds, item.conceptIds)
      );
    });

    if (changes.length === 0) {
      const processedIds = new Set(approved.map((item) => item.questionId));

      setAiConceptSuggestions((current) =>
        Object.fromEntries(
          Object.entries(current).filter(
            ([id]) => !processedIds.has(Number(id)),
          ),
        ),
      );

      showToast("Підтверджені відповідності вже збережені.", "success");
      return;
    }

    aiConceptOperationRef.current = true;
    setIsSavingConcepts(true);
    setIsProcessing(true);

    try {
      const results = await Promise.allSettled(
        changes.map(async (item) => {
          const result = await updateQuestionKnowledgeConcepts(
            item.questionId,
            item.conceptIds,
          );

          if (result.questionId !== item.questionId) {
            throw new Error("Не вдалося перевірити збереження прив'язки.");
          }

          return result;
        }),
      );

      const savedConcepts = new Map<number, number[]>();
      const failedQuestionIds: number[] = [];

      let hasValidationError = false;

      results.forEach((result, index) => {
        const questionId = changes[index].questionId;

        if (result.status === "fulfilled") {
          savedConcepts.set(
            questionId,
            normalizeKnowledgeConceptIds(result.value.knowledgeConceptIds),
          );
        } else {
          failedQuestionIds.push(questionId);

          if (
            axios.isAxiosError(result.reason) &&
            result.reason.response?.status === 400
          ) {
            hasValidationError = true;
          }
        }
      });

      const unchangedIds = new Set(
        approved
          .filter(
            (item) =>
              !changes.some((change) => change.questionId === item.questionId),
          )
          .map((item) => item.questionId),
      );

      const updatedQuestions = questions.map((question) => {
        if (question.questionId === null) {
          return question;
        }

        const saved = savedConcepts.get(question.questionId);

        return saved
          ? {
              ...question,
              knowledgeConceptIds: saved,
            }
          : question;
      });

      setQuestions(updatedQuestions);
      setSavedSnapshot(snapshot(settings, updatedQuestions));

      setAiConceptSuggestions((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) => {
            const questionId = Number(id);

            return (
              !savedConcepts.has(questionId) && !unchangedIds.has(questionId)
            );
          }),
        ),
      );

      let refreshed = false;

      try {
        const savedQuestions = [...(await getTestQuestions(test.id))].sort(
          (a, b) => a.order - b.order,
        );

        const idsMatch =
          savedQuestions.length === updatedQuestions.length &&
          savedQuestions.every(
            (item, index) => item.id === updatedQuestions[index].questionId,
          );

        if (!idsMatch) {
          throw new Error("Question IDs changed");
        }

        const synchronized = synchronizeSavedQuestions(
          savedQuestions,
          updatedQuestions,
        );

        setQuestions(synchronized);
        setSavedSnapshot(snapshot(settings, synchronized));

        refreshed = true;
      } catch {
        refreshed = false;
      }

      if (hasValidationError && courseId) {
        try {
          const freshGraph = await getKnowledgeGraph(courseId);

          setKnowledgeConcepts(freshGraph.concepts);
          setKnowledgeConceptsStatus("ready");
        } catch {
          setKnowledgeConceptsStatus("error");
        }
      }

      if (failedQuestionIds.length > 0) {
        const numbers = failedQuestionIds
          .map((id) =>
            questions.findIndex((question) => question.questionId === id),
          )
          .filter((index) => index >= 0)
          .map((index) => index + 1);

        showToast(
          `Не вдалося зберегти прив'язки для питань №${numbers.join(
            ", ",
          )}. Інші успішно збережені зміни залишилися. Перевірте ці питання та повторіть спробу.`,
          "error",
        );
      } else if (!refreshed) {
        showToast(
          "Прив'язки збережено, але не вдалося оновити список питань. Оновіть сторінку перед наступними змінами.",
          "error",
        );
      } else {
        showToast("Вибрані прив'язки успішно збережено.", "success");
      }
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        showToast(getConceptMatchingError(error), "error");
      }
    } finally {
      aiConceptOperationRef.current = false;
      setIsSavingConcepts(false);
      setIsProcessing(false);
    }
  }

  async function handleConfirmAllAiConcepts() {
    if (
      locked ||
      isProcessing ||
      isMatchingConcepts ||
      isSavingConcepts ||
      isDirty ||
      !canUseAiConceptMatching ||
      bulkConceptQuestionIds.length === 0
    ) {
      return;
    }

    const nextSuggestions = {
      ...aiConceptSuggestions,
    };

    for (const questionId of bulkConceptQuestionIds) {
      const suggestion = nextSuggestions[questionId];

      if (!suggestion) continue;

      nextSuggestions[questionId] = {
        ...suggestion,
        approved: true,
      };
    }

    setAiConceptSuggestions(nextSuggestions);

    await handleConfirmAiConcepts(
      nextSuggestions,
      new Set(bulkConceptQuestionIds),
    );
  }

  function dismissAiConceptOffer() {
    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (locked || isProcessing || !courseId) return;

    const nextSettingsErrors = getTestSettingsErrors(settings);

    const nextQuestionErrors: Record<string, QuestionDraftErrors> = {};

    let firstInvalidQuestionKey: string | null = null;

    for (const question of questions) {
      const errors = getQuestionDraftErrors(question);

      if (hasQuestionDraftErrors(errors)) {
        nextQuestionErrors[question.key] = errors;

        if (!firstInvalidQuestionKey) {
          firstInvalidQuestionKey = question.key;
        }
      }
    }

    setSettingsErrors(nextSettingsErrors);
    setQuestionErrors(nextQuestionErrors);
    setValidationSubmitted(true);

    const hasSettingsErrors = Object.values(nextSettingsErrors).some(Boolean);

    if (hasSettingsErrors) {
      document.getElementById("test-settings-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      showToast(
        "Перевірте правильність заповнення налаштувань тесту.",
        "error",
      );

      return;
    }

    if (questions.length === 0) {
      document.getElementById("test-questions-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      showToast("Додайте щонайменше одне питання.", "error");

      return;
    }

    if (firstInvalidQuestionKey) {
      setExpandedKey(firstInvalidQuestionKey);
      setScrollToQuestionKey(firstInvalidQuestionKey);

      showToast("Виправте помилки в питаннях тесту.", "error");

      return;
    }
    if (
      knowledgeConceptsStatus === "ready" ||
      knowledgeConceptsStatus === "missing"
    ) {
      const availableIds = new Set(
        knowledgeConcepts.map((concept) => concept.id),
      );

      const invalidQuestion = questions.find((question) =>
        question.knowledgeConceptIds.some((id) => !availableIds.has(id)),
      );

      if (invalidQuestion) {
        setExpandedKey(invalidQuestion.key);
        setScrollToQuestionKey(invalidQuestion.key);

        showToast(
          "Деякі вибрані поняття більше недоступні. Перевірте прив'язки питань перед збереженням.",
          "error",
        );

        return;
      }
    }
    setIsProcessing(true);

    try {
      const payload = buildFullTestPayload(settings, questions);

      if (mode === "create") {
        const created = await createFullTest(courseId, payload);

        const newId = created?.id;

        if (
          typeof newId === "number" &&
          Number.isSafeInteger(newId) &&
          newId > 0
        ) {
          const newDraftKey = getConstructorDraftKey(courseId, newId);

          try {
            const savedQuestions = await getTestQuestions(newId);

            const synchronizedQuestions = synchronizeSavedQuestions(
              savedQuestions,
              questions,
            );

            saveConstructorDraft(newDraftKey, {
              settings,
              questions: synchronizedQuestions,
              creationMethod,
              importedJobIds,
            });
          } catch {
            removeConstructorDraft(newDraftKey);
          }
        }

        if (draftStorageKey) {
          removeConstructorDraft(draftStorageKey);
        }

        showToast("Тест і всі питання успішно створено.", "success");

        navigate(
          typeof newId === "number" && Number.isSafeInteger(newId) && newId > 0
            ? `/tests/${newId}/edit`
            : backPath,
          {
            replace: true,
            state:
              typeof newId === "number" &&
              Number.isSafeInteger(newId) &&
              newId > 0
                ? { offerKnowledgeConcepts: true }
                : null,
          },
        );
      } else if (test) {
        await updateTestDraft(test.id, payload);
        setAiConceptSuggestions({});

        let questionsRefreshed = false;

        try {
          const savedQuestions = await getTestQuestions(test.id);

          if (savedQuestions.length !== questions.length) {
            throw new Error("Questions count mismatch");
          }

          const synchronizedQuestions = synchronizeSavedQuestions(
            savedQuestions,
            questions,
          );

          setQuestions(synchronizedQuestions);
          setSavedSnapshot(snapshot(settings, synchronizedQuestions));

          questionsRefreshed = true;
        } catch {
          setQuestions((current) =>
            current.map((question) => ({
              ...question,
              questionId: null,
            })),
          );

          setSavedSnapshot(snapshot(settings, questions));
        }

        setTest((current) =>
          current
            ? {
                ...current,
                title: payload.title,
                description: payload.description ?? null,
                maxAttempts: payload.maxAttempts ?? null,
                deadline: payload.deadline ?? null,
                questionsCount: questions.length,
                totalPoints: questions.reduce(
                  (sum, question) => sum + Number(question.points),
                  0,
                ),
              }
            : current,
        );
        setSettingsErrors({});
        setQuestionErrors({});
        setValidationSubmitted(false);
        showToast(
          questionsRefreshed
            ? "Чернетку та всі питання збережено."
            : "Чернетку збережено, але не вдалося оновити список питань. Оновіть сторінку перед автоматичним визначенням понять.",
          questionsRefreshed ? "success" : "error",
        );
      }
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        showToast(getTestApiError(error, "Не вдалося зберегти тест."), "error");
      }
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirm() {
    if (!pendingAction || isProcessing) return;

    if (pendingAction.kind === "removeQuestion") {
      const removedKey = pendingAction.key;

      setQuestions((current) =>
        current.filter((item) => item.key !== removedKey),
      );

      setQuestionErrors((current) => {
        const next = { ...current };
        delete next[removedKey];
        return next;
      });

      setExpandedKey((current) => (current === removedKey ? null : current));

      setPendingAction(null);
      return;
    }
    if (pendingAction.kind === "removeAllQuestions") {
      setQuestions([]);

      setQuestionErrors({});
      setValidationSubmitted(false);

      setExpandedKey(null);
      setScrollToQuestionKey(null);

      setPendingAction(null);

      showToast("Усі питання прибрано з конструктора.", "success");

      return;
    }
    if (!test || (pendingAction.kind === "publish" && isDirty)) {
      return;
    }

    setIsProcessing(true);

    try {
      if (pendingAction.kind === "publish") {
        await publishTest(test.id);

        setAiConceptSuggestions({});

        setTest((current) =>
          current ? { ...current, isPublished: true } : current,
        );

        showToast("Тест опубліковано.", "success");
      } else if (pendingAction.kind === "archive") {
        await archiveTest(test.id);

        setAiConceptSuggestions({});

        setTest((current) =>
          current ? { ...current, isArchived: true } : current,
        );

        showToast("Тест архівовано.", "success");
      } else {
        await deleteTest(test.id);
        if (draftStorageKey) {
          removeConstructorDraft(draftStorageKey);
        }
        showToast("Чернетку видалено.", "success");
        navigate(backPath, { replace: true });
      }

      setPendingAction(null);
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        showToast(getTestApiError(error, "Не вдалося виконати дію."), "error");
      }
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page test-editor-page">
        <p className="test-page-notice">Завантаження конструктора...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page test-editor-page">
        <Link className="test-back-link" to={backPath}>
          <ArrowLeft size={17} />
          До курсів
        </Link>

        <div className="test-page-notice test-page-notice--error">
          {loadError}
        </div>
      </div>
    );
  }

  const status = test?.isArchived
    ? "Архівований"
    : test?.isPublished
      ? "Опублікований"
      : "Чернетка";

  const confirmation = pendingAction
    ? confirmationDetails(pendingAction)
    : null;

  return (
    <div className="page test-editor-page test-constructor-page">
      <Link className="test-back-link" to={backPath}>
        <ArrowLeft size={17} />
        До курсу
      </Link>

      <header className="test-page-heading">
        <div className="test-page-heading-icon">
          <ClipboardList size={24} />
        </div>

        <div>
          <span className="test-eyebrow">{courseTitle}</span>

          <h1>{mode === "create" ? "Створення тесту" : "Конструктор тесту"}</h1>

          <p>Налаштуйте тест і питання, а потім збережіть усе однією дією.</p>
        </div>

        <span className="test-constructor-status">{status}</span>
      </header>

      {locked && (
        <div className="test-editor-locked-note">
          <LockKeyhole size={18} />
          Цей тест більше не можна редагувати. Доступний тільки перегляд.
        </div>
      )}

      {showAiConceptOffer && (
        <section className="test-ai-concepts-offer">
          <span className="test-ai-concepts-offer-icon">
            <Sparkles size={22} />
          </span>

          <div className="test-ai-concepts-offer-content">
            <h3>Тест успішно збережено!</h3>

            <p>
              Бажаєте автоматично визначити, які навчальні поняття перевіряють
              його питання? Це допоможе надалі аналізувати прогалини в знаннях
              студентів.
            </p>

            <div className="test-ai-concepts-offer-actions">
              <button
                type="button"
                className="test-btn test-btn--primary"
                disabled={isProcessing}
                onClick={() => {
                  dismissAiConceptOffer();
                  void handleSuggestKnowledgeConcepts();
                }}
              >
                <Sparkles size={16} />
                Визначити поняття
              </button>

              <button
                type="button"
                className="test-btn test-btn--secondary"
                disabled={isProcessing}
                onClick={dismissAiConceptOffer}
              >
                Пізніше
              </button>
            </div>
          </div>
        </section>
      )}

      <form onSubmit={handleSave} className="test-constructor-form" noValidate>
        <section className="test-panel test-constructor-method">
          <div className="test-panel-heading">
            <h2>Спосіб створення</h2>
            <p>
              Оберіть, як додавати питання. Перемикання між способами не видаляє
              вже додані питання.
            </p>
          </div>

          <TestDropdown
            value={creationMethod}
            options={methodOptions}
            onChange={setCreationMethod}
            ariaLabel="Спосіб створення тесту"
            disabled={locked || isProcessing}
          />
        </section>

        {creationMethod === "ai" && courseId && !locked && draftStorageKey && (
          <section className="test-panel test-constructor-ai">
            <AiGenerationPanel
              key={draftStorageKey}
              courseId={courseId}
              draftKey={draftStorageKey}
              questions={questions}
              importedJobIds={importedJobIds}
              disabled={isProcessing}
              onImport={handleImportAiQuestions}
            />
          </section>
        )}

        <section id="test-settings-section" className="test-panel">
          <div className="test-panel-heading">
            <h2>1. Основна інформація</h2>
            <p>Назва, опис, кількість спроб і дедлайн.</p>
          </div>

          <TestSettingsForm
            value={settings}
            onChange={updateSettings}
            onFieldBlur={validateSettingsField}
            errors={settingsErrors}
            disabled={locked || isProcessing}
          />
        </section>

        <section id="test-questions-section" className="test-panel">
          <div className="test-constructor-questions-heading">
            <div className="test-panel-heading">
              <h2>2. Питання тесту</h2>
              <p>
                {questions.length} питань · {totalPoints} балів
              </p>
            </div>

            {!locked && questions.length > 0 && (
              <button
                type="button"
                className="test-btn test-btn--danger-outline"
                disabled={isProcessing}
                onClick={() => setPendingAction({ kind: "removeAllQuestions" })}
              >
                <Trash2 size={16} />
                Видалити всі питання
              </button>
            )}
          </div>

          {mode === "edit" && test && !locked && (
            <div className="test-ai-concepts-toolbar">
              <div className="test-ai-concepts-toolbar-heading">
                <span className="test-ai-concepts-toolbar-icon">
                  <Sparkles size={19} />
                </span>

                <div>
                  <h3>Автоматичне визначення понять</h3>

                  <p>
                    LearnAI проаналізує питання тесту та запропонує відповідні
                    поняття з графа знань. Остаточний вибір залишиться за вами.
                  </p>
                </div>
              </div>

              {knowledgeConceptsStatus === "missing" && (
                <p className="test-ai-concepts-notice">
                  Для автоматичного визначення понять спочатку створіть граф
                  знань курсу.
                </p>
              )}

              {knowledgeConceptsStatus === "error" && (
                <p className="test-ai-concepts-notice">
                  Не вдалося завантажити граф знань. Оновіть сторінку або
                  виберіть поняття вручну.
                </p>
              )}

              {knowledgeConceptsStatus === "ready" &&
                knowledgeConcepts.length === 0 && (
                  <p className="test-ai-concepts-notice">
                    Граф знань поки не містить навчальних понять.
                  </p>
                )}

              {knowledgeConcepts.length > 120 && (
                <p className="test-ai-concepts-notice">
                  Граф містить понад 120 понять. Автоматичне визначення поки
                  недоступне, але ви можете вибрати поняття вручну.
                </p>
              )}

              {isDirty && (
                <p className="test-ai-concepts-notice">
                  Є незбережені зміни. Спочатку збережіть чернетку тесту, а
                  потім запустіть LearnAI.
                </p>
              )}

              {isMatchingConcepts && (
                <div
                  className="test-ai-concepts-progress"
                  role="status"
                  aria-live="polite"
                >
                  <LoaderCircle
                    size={18}
                    className="test-ai-concepts-spinner"
                  />
                  Аналізуємо питання тесту та визначаємо відповідні навчальні
                  поняття…
                </div>
              )}

              <div className="test-ai-concepts-toolbar-actions">
                <button
                  type="button"
                  className="test-btn test-btn--secondary"
                  disabled={isProcessing || !canUseAiConceptMatching}
                  onClick={() => void handleSuggestKnowledgeConcepts()}
                >
                  {isMatchingConcepts ? (
                    <LoaderCircle
                      size={17}
                      className="test-ai-concepts-spinner"
                    />
                  ) : (
                    <Sparkles size={17} />
                  )}

                  {isMatchingConcepts
                    ? "Аналізуємо..."
                    : hasAiConceptSuggestions
                      ? "Повторити аналіз"
                      : "Автоматично визначити поняття"}
                </button>

                {hasAiConceptSuggestions && (
                  <span className="test-ai-concepts-counter">
                    Пропозиції для{" "}
                    {
                      suggestionEntries.filter(
                        ([, suggestion]) =>
                          suggestion.recommendedConceptIds.length > 0,
                      ).length
                    }{" "}
                    питань
                  </span>
                )}
              </div>

              {bulkConceptQuestionIds.length > 0 && (
                <div className="test-ai-concept-bulk">
                  <div>
                    <strong>Пропозиції LearnAI готові</strong>

                    <p>
                      Можна прив'язати поняття одразу до{" "}
                      {bulkConceptQuestionIds.length} питань або переглянути
                      кожне окремо.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="test-btn test-btn--primary"
                    disabled={
                      locked ||
                      !canUseAiConceptMatching ||
                      isProcessing ||
                      isMatchingConcepts ||
                      isSavingConcepts ||
                      isDirty
                    }
                    onClick={() => void handleConfirmAllAiConcepts()}
                  >
                    {isSavingConcepts
                      ? "Зберігаємо прив'язки..."
                      : `Прив'язати до ${bulkConceptQuestionIds.length} питань`}
                  </button>
                </div>
              )}

              {hasAiConceptSuggestions && (
                <div className="test-ai-concepts-confirm">
                  <div>
                    <strong>
                      Підтверджено питань: {approvedSuggestionCount}
                    </strong>

                    <p>
                      Відмітьте потрібні питання та перевірте поняття перед
                      збереженням.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="test-btn test-btn--primary"
                    disabled={
                      isProcessing || isDirty || approvedSuggestionCount === 0
                    }
                    onClick={() => void handleConfirmAiConcepts()}
                  >
                    {isSavingConcepts
                      ? "Зберігаємо прив'язки..."
                      : "Підтвердити та зберегти прив'язки"}
                  </button>
                </div>
              )}

              {hasAiConceptSuggestions && (
                <p className="test-ai-concepts-footnote">
                  Повторний аналіз може змінити непідтверджені пропозиції, але
                  не змінить уже збережені прив'язки без вашого підтвердження.
                </p>
              )}
            </div>
          )}

          {questions.length === 0 && (
            <div className="test-constructor-empty">
              Питань поки немає. Додайте перше питання нижче.
            </div>
          )}

          <div className="test-constructor-questions">
            {questions.map((question, index) => (
              <InlineQuestionEditor
                key={question.key}
                question={question}
                index={index}
                total={questions.length}
                expanded={expandedKey === question.key}
                disabled={locked || isProcessing}
                courseId={courseId ?? 0}
                knowledgeConcepts={knowledgeConcepts}
                knowledgeConceptsStatus={knowledgeConceptsStatus}
                aiConceptSuggestion={
                  question.questionId !== null
                    ? aiConceptSuggestions[question.questionId]
                    : undefined
                }
                onAiConceptSelectionChange={(ids) => {
                  if (question.questionId !== null) {
                    updateAiConceptSelection(question.questionId, ids);
                  }
                }}
                onAiConceptApprovalChange={(approved) => {
                  if (question.questionId !== null) {
                    updateAiConceptApproval(question.questionId, approved);
                  }
                }}
                onToggle={() =>
                  setExpandedKey((current) =>
                    current === question.key ? null : question.key,
                  )
                }
                onChange={(next) => updateQuestion(question.key, next)}
                onMove={(direction) => moveQuestion(index, direction)}
                onDelete={() =>
                  setPendingAction({
                    kind: "removeQuestion",
                    key: question.key,
                  })
                }
                errors={questionErrors[question.key]}
                onFieldBlur={(field, optionKey) =>
                  validateQuestionField(question.key, field, optionKey)
                }
              />
            ))}
          </div>

          {!locked && creationMethod === "manual" && (
            <button
              type="button"
              className="test-constructor-add"
              onClick={addQuestion}
              disabled={isProcessing}
            >
              <Plus size={19} />
              Додати питання вручну
            </button>
          )}
        </section>

        <div className="test-constructor-footer">
          <div className="test-constructor-footer-hint">
            {hasInvalidQuestions ? (
              <span className="test-constructor-validation-hint">
                <AlertCircle size={16} />
                Виправте помилки в питаннях, щоб зберегти тест.
              </span>
            ) : isDirty ? (
              "Є незбережені зміни."
            ) : (
              "Збереження не публікує тест."
            )}
          </div>

          <div className="test-constructor-footer-actions">
            {mode === "edit" &&
              test &&
              !test.isPublished &&
              !test.isArchived && (
                <button
                  type="button"
                  className="test-btn test-btn--danger-outline"
                  disabled={isProcessing || isDirty}
                  onClick={() => setPendingAction({ kind: "deleteTest" })}
                >
                  <Trash2 size={16} />
                  Видалити тест
                </button>
              )}

            {mode === "edit" && test && !test.isArchived && (
              <button
                type="button"
                className="test-btn test-btn--secondary"
                disabled={isProcessing || isDirty}
                onClick={() => setPendingAction({ kind: "archive" })}
              >
                <Archive size={16} />
                Архівувати
              </button>
            )}

            {mode === "edit" && test && !locked && (
              <button
                type="button"
                className="test-btn test-btn--secondary"
                disabled={isProcessing || isDirty || questions.length === 0}
                title={isDirty ? "Спочатку збережіть зміни" : undefined}
                onClick={() => setPendingAction({ kind: "publish" })}
              >
                <Send size={16} />
                Опублікувати
              </button>
            )}

            {!locked && (
              <button
                className="test-btn test-btn--primary"
                type="submit"
                disabled={
                  isProcessing ||
                  hasInvalidQuestions ||
                  (mode === "edit" && !isDirty)
                }
                title={
                  hasInvalidQuestions
                    ? "Виправте помилки в питаннях перед збереженням"
                    : undefined
                }
              >
                <Save size={17} />

                {isProcessing ? "Збереження..." : "Зберегти чернетку"}
              </button>
            )}
          </div>
        </div>
      </form>

      {pendingAction && confirmation && (
        <TestConfirmModal
          title={confirmation.title}
          description={confirmation.description}
          confirmLabel={confirmation.confirmLabel}
          danger={confirmation.danger}
          isProcessing={isProcessing}
          onCancel={() => setPendingAction(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

export default TestConstructorPage;
