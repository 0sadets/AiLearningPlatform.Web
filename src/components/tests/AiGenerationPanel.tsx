import { useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  Plus,
  Sparkles,
  XCircle,
} from "lucide-react";

import { getCourseMaterials } from "../../api/coursesApi";
import {
  cancelAiGeneration,
  createAiGeneration,
  getAiGenerationResult,
  getAiGenerationStatus,
} from "../../api/aiGenerationsApi";

import { CourseMaterialType } from "../../types/courseMaterial";
import type { CourseMaterial } from "../../types/courseMaterial";

import type {
  AiDifficulty,
  AiGenerationJobDto,
  AiGenerationResultDto,
  AiQuestionCounts,
} from "../../types/aiGeneration";

import type { QuestionDraft } from "../../utils/testDraft";

import {
  getTestApiError,
  isUnauthorizedError,
} from "../../utils/testForm";

import { useToast } from "../../context/ToastContext";
import "../../styles/ai-generation.css";

interface Props {
  courseId: number;
  draftKey: string;
  questions: QuestionDraft[];
  importedJobIds: string[];

  disabled: boolean;

  onImport: (
    jobId: string,
    result: AiGenerationResultDto,
  ) => void;
}

const POLL_INTERVAL = 4000;

const initialCounts: AiQuestionCounts = {
  singleChoice: 3,
  multipleChoice: 0,
  trueFalse: 0,
};

function getJobStorageKey(draftKey: string) {
  return `ilearn:ai-active-job:${draftKey}`;
}

function AiGenerationPanel({
  courseId,
  draftKey,
  questions,
  importedJobIds,
  disabled,
  onImport,
}: Props) {
  const { showToast } = useToast();

  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState("");

  const [materialIds, setMaterialIds] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<AiDifficulty>("medium");
  const [counts, setCounts] = useState<AiQuestionCounts>(initialCounts);

  const [jobId, setJobId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(getJobStorageKey(draftKey));
    } catch {
      return null;
    }
  });

  const [job, setJob] = useState<AiGenerationJobDto | null>(null);
  const [result, setResult] = useState<AiGenerationResultDto | null>(null);

  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [jobError, setJobError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMaterials() {
      setMaterialsLoading(true);
      setMaterialsError("");

      try {
        const items = await getCourseMaterials(courseId);

        if (!active) return;

        // Посилання наразі не підтримуються AI-генерацією.
        setMaterials(
          items.filter(
            (item) =>
              item.type === CourseMaterialType.Text ||
              item.type === CourseMaterialType.File,
          ),
        );
      } catch (error) {
        if (!active) return;

        setMaterialsError(
          getTestApiError(
            error,
            "Не вдалося завантажити матеріали курсу.",
          ),
        );
      } finally {
        if (active) setMaterialsLoading(false);
      }
    }

    void loadMaterials();

    return () => {
      active = false;
    };
  }, [courseId]);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (!jobId) return;

    async function poll() {
      try {
        const status = await getAiGenerationStatus(courseId, jobId!);

        if (!active) return;

        setJob(status);
        setJobError("");

        if (!status.isFinished) {
          timeout = setTimeout(poll, POLL_INTERVAL);
        }
      } catch (error) {
        if (!active) return;

        setJobError(
          getTestApiError(
            error,
            "Не вдалося отримати стан генерації.",
          ),
        );

        if (!isUnauthorizedError(error)) {
          timeout = setTimeout(poll, POLL_INTERVAL);
        }
      }
    }

    void poll();

    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [courseId, jobId]);

  const totalRequested =
    counts.singleChoice +
    counts.multipleChoice +
    counts.trueFalse;

  const busy =
    starting ||
    cancelling ||
    loadingResult ||
    (!!jobId && (!job || !job.isFinished));

  const alreadyImported =
    !!jobId && importedJobIds.includes(jobId);

  function toggleMaterial(id: number) {
    setMaterialIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return current.length < 5 ? [...current, id] : current;
    });
  }

  function updateCount(
    key: keyof AiQuestionCounts,
    value: string,
  ) {
    const number = Number(value);

    setCounts((current) => ({
      ...current,
      [key]: Number.isFinite(number)
        ? Math.max(0, Math.min(30, Math.trunc(number)))
        : 0,
    }));
  }

  async function handleGenerate() {
    if (disabled || busy || jobId) return;

    if (materialIds.length < 1 || materialIds.length > 5) {
      showToast("Оберіть від 1 до 5 матеріалів.", "info");
      return;
    }

    if (totalRequested < 1 || totalRequested > 30) {
      showToast(
        "Кількість нових питань має бути від 1 до 30.",
        "info",
      );
      return;
    }

    const existingQuestions = [
      ...new Set(
        questions
          .map((question) => question.text.trim())
          .filter(Boolean),
      ),
    ];

    const totalCharacters = existingQuestions.reduce(
      (sum, question) => sum + question.length,
      0,
    );

    if (
      existingQuestions.length > 100 ||
      existingQuestions.some((text) => text.length > 2000) ||
      totalCharacters > 15000
    ) {
      showToast(
        "Список наявних питань перевищує ліміт AI: максимум 100 питань і 15 000 символів загалом.",
        "error",
      );
      return;
    }

    setStarting(true);
    setResult(null);
    setJobError("");

    try {
      const created = await createAiGeneration(courseId, {
        materialIds,
        difficulty,
        questionCounts: counts,
        existingQuestions,
      });

      sessionStorage.setItem(
        getJobStorageKey(draftKey),
        created.id,
      );

      setJob(created);
      setJobId(created.id);

      showToast("Генерацію LearnAI запущено.", "success");
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        showToast(
          getTestApiError(error, "Не вдалося запустити генерацію."),
          "error",
        );
      }
    } finally {
      setStarting(false);
    }
  }

  async function handleCancel() {
    if (!jobId || cancelling || !job || job.isFinished) return;

    setCancelling(true);

    try {
      const updated = await cancelAiGeneration(courseId, jobId);

      setJob(updated);
      showToast("Запит на скасування надіслано.", "success");
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        showToast(
          getTestApiError(error, "Не вдалося скасувати генерацію."),
          "error",
        );
      }
    } finally {
      setCancelling(false);
    }
  }

  async function handleLoadResult() {
    if (!jobId || loadingResult || alreadyImported) return;

    setLoadingResult(true);

    try {
      const data = await getAiGenerationResult(courseId, jobId);

      if (!data) {
        showToast(
          "Генерація ще завершується. Спробуйте пізніше.",
          "info",
        );
        return;
      }

      setResult(data);
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        showToast(
          getTestApiError(
            error,
            "Не вдалося отримати згенеровані питання.",
          ),
          "error",
        );
      }
    } finally {
      setLoadingResult(false);
    }
  }

  function handleImport() {
    if (!jobId || !result || alreadyImported || disabled) return;

    onImport(jobId, result);

    setResult(null);

    showToast(
      `${result.questions.length} питань додано до конструктора.`,
      "success",
    );
  }

  function clearFinishedJob() {
    if (!job?.isFinished || !jobId) return;

    // Не дозволяємо випадково відкинути ще не імпортований результат.
    if (
      (job.status === "Completed" ||
        job.status === "PartiallyCompleted" ||
        job.generatedQuestionsCount > 0) &&
      !alreadyImported
    ) {
      showToast(
        "Спочатку отримайте й додайте результат генерації.",
        "info",
      );
      return;
    }

    sessionStorage.removeItem(getJobStorageKey(draftKey));

    setJobId(null);
    setJob(null);
    setResult(null);
    setJobError("");
  }

  const statusLabel: Record<string, string> = {
    Pending: "Очікує на обробку",
    Processing: "Генерація триває",
    Completed: "Генерацію завершено",
    PartiallyCompleted: "Частковий результат",
    Failed: "Помилка генерації",
    Cancelled: "Генерацію скасовано",
  };

  return (
    <div className="ai-generation-panel">
      {!jobId && (
        <>
          <div className="ai-generation-intro">
            <Sparkles size={20} />
            <div>
              <h3>Генерація питань із матеріалів</h3>
              <p>
                LearnAI створить питання на основі вибраних
                навчальних матеріалів. Ви зможете перевірити
                та відредагувати кожне питання.
              </p>
            </div>
          </div>

          <div className="ai-generation-field">
            <strong>
              <BookOpen size={17} />
              Матеріали курсу
            </strong>
            <p>Оберіть від 1 до 5 матеріалів.</p>

            {materialsLoading ? (
              <p>Завантаження матеріалів...</p>
            ) : materialsError ? (
              <div className="ai-generation-warning">
                {materialsError}
              </div>
            ) : materials.length === 0 ? (
              <div className="ai-generation-warning">
                Для генерації поки немає текстових або файлових
                матеріалів.
              </div>
            ) : (
              <div className="ai-generation-materials">
                {materials.map((material) => (
                  <label
                    key={material.id}
                    className="ai-generation-material"
                  >
                    <input
                      type="checkbox"
                      checked={materialIds.includes(material.id)}
                      disabled={
                        disabled ||
                        (!materialIds.includes(material.id) &&
                          materialIds.length >= 5)
                      }
                      onChange={() => toggleMaterial(material.id)}
                    />

                    <span>{material.title}</span>

                    <small>
                      {material.type === CourseMaterialType.Text
                        ? "Текст"
                        : "Файл"}
                    </small>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="ai-generation-field">
            <strong>Складність</strong>

            <div className="ai-generation-difficulties">
              {(
                [
                  ["easy", "Легка"],
                  ["medium", "Середня"],
                  ["hard", "Висока"],
                ] as const
              ).map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name={`ai-difficulty-${draftKey}`}
                    checked={difficulty === value}
                    disabled={disabled}
                    onChange={() => setDifficulty(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="ai-generation-field">
            <strong>Кількість нових питань</strong>

            <div className="ai-generation-counts">
              {(
                [
                  ["singleChoice", "Одна відповідь"],
                  ["multipleChoice", "Декілька відповідей"],
                  ["trueFalse", "Так / Ні"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={1}
                    value={counts[key]}
                    disabled={disabled}
                    onChange={(event) =>
                      updateCount(key, event.target.value)
                    }
                  />
                </label>
              ))}
            </div>

            <p>
              Усього нових питань: <strong>{totalRequested}/30</strong>
            </p>
          </div>

          <div className="ai-generation-actions">
            <button
              type="button"
              className="test-btn test-btn--primary"
              disabled={
                disabled ||
                starting ||
                materialIds.length === 0 ||
                totalRequested < 1 ||
                totalRequested > 30
              }
              onClick={handleGenerate}
            >
              <Sparkles size={17} />
              {starting ? "Створення завдання..." : "Згенерувати питання"}
            </button>
          </div>
        </>
      )}

      {jobId && (
        <div className="ai-generation-job">
          <div className="ai-generation-job-heading">
            <div>
              <h3>
                <Sparkles size={19} />
                {job
                  ? statusLabel[job.status]
                  : "Відновлення генерації..."}
              </h3>
              <p>
                {job?.cancellationRequested
                  ? "Очікуємо підтвердження скасування..."
                  : "Прогрес показує частку прийнятих питань, а не залишок часу."}
              </p>
            </div>

            {!job?.isFinished && (
              <LoaderCircle className="ai-generation-spinner" size={22} />
            )}
          </div>

          <div className="ai-generation-progress-heading">
            <span>
              Прийнято {job?.generatedQuestionsCount ?? 0} із{" "}
              {job?.requestedQuestionsCount ?? "—"} питань
            </span>

            <strong>{job?.progressPercentage ?? 0}%</strong>
          </div>

          <div
            className="ai-generation-progress-track"
            role="progressbar"
            aria-label="Прогрес AI-генерації"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={job?.progressPercentage ?? 0}
          >
            <div
              className="ai-generation-progress-fill"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, job?.progressPercentage ?? 0),
                )}%`,
              }}
            />
          </div>

          {!!job?.totalBatches && (
            <p className="ai-generation-batch">
              Пакет {job.currentBatchIndex} із {job.totalBatches}
            </p>
          )}

          {jobError && (
            <div className="ai-generation-warning">
              <AlertCircle size={17} />
              {jobError}
            </div>
          )}

          {job?.errorMessage && (
            <div className="ai-generation-warning">
              <AlertCircle size={17} />
              {job.errorMessage}
            </div>
          )}

          {job?.isFinished && job.generatedQuestionsCount > 0 && (
            <div className="ai-generation-finished">
              <CheckCircle2 size={19} />
              <span>
                {job.status === "PartiallyCompleted"
                  ? "Частину питань створено. Доступний результат можна додати до конструктора."
                  : "Готові питання можна додати до конструктора."}
              </span>
            </div>
          )}

          {job?.isFinished &&
            job.generatedQuestionsCount > 0 &&
            !alreadyImported &&
            !result && (
              <button
                type="button"
                className="test-btn test-btn--primary"
                onClick={handleLoadResult}
                disabled={disabled || loadingResult}
              >
                {loadingResult
                  ? "Отримання результату..."
                  : "Переглянути згенеровані питання"}
              </button>
            )}

          {result && !alreadyImported && (
            <div className="ai-generation-result">
              <strong>
                Згенеровано {result.questions.length} питань
              </strong>

              {result.isPartialResult && (
                <p>Результат частковий: деякі питання не вдалося створити.</p>
              )}

              {result.warnings.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}

              <button
                type="button"
                className="test-btn test-btn--primary"
                disabled={disabled}
                onClick={handleImport}
              >
                <Plus size={17} />
                Додати {result.questions.length} питань до тесту
              </button>
            </div>
          )}

          {alreadyImported && (
            <div className="ai-generation-finished">
              <CheckCircle2 size={18} />
              Питання вже додано до конструктора.
            </div>
          )}

          {job && !job.isFinished && (
            <button
              type="button"
              className="ai-generation-cancel"
              disabled={cancelling || job.cancellationRequested}
              onClick={handleCancel}
            >
              <XCircle size={17} />
              {cancelling
                ? "Скасування..."
                : job.cancellationRequested
                  ? "Очікування скасування"
                  : "Скасувати генерацію"}
            </button>
          )}

          {job?.isFinished && (
            <button
              type="button"
              className="ai-generation-reset"
              onClick={clearFinishedJob}
            >
              Налаштувати наступну генерацію
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default AiGenerationPanel;