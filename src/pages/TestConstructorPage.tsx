import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  ClipboardList,
  LockKeyhole,
  Plus,
  Save,
  Send,
  Trash2,
  AlertCircle,
} from "lucide-react";

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
  const { showToast } = useToast();

  const [test, setTest] = useState<TestDto | null>(null);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courseTitle, setCourseTitle] = useState("");

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

          setTest(loadedTest);
          setCourseId(course.id);
          setCourseTitle(course.title);

          setSettings(restored?.settings ?? nextSettings);
          setQuestions(restored?.questions ?? nextQuestions);

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

    const newQuestions = result.questions.map(mapAiQuestionToDraft);

    const updatedQuestions = [...questions, ...newQuestions];

    const updatedJobIds = [...importedJobIds, jobId];

    // Зберігаємо питання та факт імпорту разом, до оновлення UI.
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

          saveConstructorDraft(newDraftKey, {
            settings,
            questions,
            creationMethod,
            importedJobIds,
          });
        }

        if (draftStorageKey) {
          removeConstructorDraft(draftStorageKey);
        }

        showToast("Тест і всі питання успішно створено.", "success");

        navigate(
          typeof newId === "number" && Number.isSafeInteger(newId) && newId > 0
            ? `/tests/${newId}/edit`
            : backPath,
          { replace: true },
        );
      } else if (test) {
        await updateTestDraft(test.id, payload);

        setSavedSnapshot(snapshot(settings, questions));

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
        showToast("Чернетку та всі питання збережено.", "success");
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

        setTest((current) =>
          current ? { ...current, isPublished: true } : current,
        );

        showToast("Тест опубліковано.", "success");
      } else if (pendingAction.kind === "archive") {
        await archiveTest(test.id);

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
