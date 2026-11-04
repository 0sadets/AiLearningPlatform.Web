import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { RefreshCw } from "lucide-react";
import {
  createCourseMaterial,
  updateCourseMaterial,
  refreshCourseMaterialSnapshot,
} from "../api/coursesApi";

import {
  CourseMaterialType,
  type CourseMaterial,
} from "../types/courseMaterial";

import { useToast } from "../context/ToastContext";

import "../styles/material-modal.css";

import FormField from "./ui/FormField";

import {
  validateFile,
  validateHttpsUrl,
  validateRequired,
} from "../utils/validation";


interface MaterialModalProps {
  isOpen: boolean;
  courseId: number;
  material?: CourseMaterial | null;
  onClose: () => void;
  onSaved: (material: CourseMaterial) => void;
}

function MaterialModal({
  isOpen,
  courseId,
  material,
  onClose,
  onSaved,
}: MaterialModalProps) {
  const isEditMode = !!material;
  const { showToast } = useToast();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CourseMaterialType>(CourseMaterialType.Text);

  const [textContent, setTextContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | undefined>();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
const [errors, setErrors] = useState<{
  title?: string;
  url?: string;
  textContent?: string;
  file?: string;
}>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (material) {
      setTitle(material.title);
      setType(material.type);
      setTextContent(material.textContent ?? "");
      setUrl(material.url ?? "");
      setFile(undefined);
    } else {
      setTitle("");
      setType(CourseMaterialType.Text);
      setTextContent("");
      setUrl("");
      setFile(undefined);
    }

    setError("");
    setErrors({});
  }, [isOpen, material]);

  const handleClose = () => {
    if (isSaving || isRefreshing) {
      return;
    }

    onClose();
  };
  const handleRefreshSnapshot = async () => {
    if (
      !material ||
      material.type !== CourseMaterialType.Link ||
      isSaving ||
      isRefreshing
    ) {
      return;
    }

    if (url.trim() !== (material.url ?? "").trim()) {
      setError(
        "Спочатку збережіть нове посилання. Окремо оновлювати вміст після зміни URL не потрібно.",
      );
      return;
    }

    setError("");
    setIsRefreshing(true);

    try {
      await refreshCourseMaterialSnapshot(courseId, material.id);

      showToast("Перевірку вмісту завершено.", "success");
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;

        const message =
          typeof error.response?.data?.message === "string"
            ? error.response.data.message
            : null;

        if (status === 403) {
          setError("У вас немає прав для оновлення цього матеріалу.");
        } else if (status === 404) {
          setError("Навчальний матеріал не знайдено.");
        } else if (status === 400) {
          setError(
            message || "Не вдалося отримати або обробити вміст посилання.",
          );
        } else if (status !== 401) {
          setError(message || "Не вдалося оновити вміст матеріалу.");
        }
      } else {
        setError("Сталася помилка під час оновлення вмісту.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || isRefreshing) return;
    const trimmedTitle = title.trim();
    const nextErrors = {
      title: validateRequired(title, "Назва матеріалу"),

      url: type === CourseMaterialType.Link ? validateHttpsUrl(url) : undefined,

      textContent:
        type === CourseMaterialType.Text
          ? validateRequired(textContent, "Текст матеріалу")
          : undefined,

      file:
        type === CourseMaterialType.File
          ? validateFile(file, { required: !isEditMode })
          : undefined,
    };

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }
   


    setError("");
    setIsSaving(true);

    try {
      let savedMaterial: CourseMaterial;

      if (material) {
        savedMaterial = await updateCourseMaterial(courseId, material.id, {
          title: trimmedTitle,

          textContent:
            type === CourseMaterialType.Text ? textContent.trim() : undefined,

          url: type === CourseMaterialType.Link ? url.trim() : undefined,

          file: type === CourseMaterialType.File ? file : undefined,
        });
      } else {
        savedMaterial = await createCourseMaterial(courseId, {
          title: trimmedTitle,
          type,

          textContent:
            type === CourseMaterialType.Text ? textContent.trim() : undefined,

          url: type === CourseMaterialType.Link ? url.trim() : undefined,

          file: type === CourseMaterialType.File ? file : undefined,
        });
      }

      onSaved(savedMaterial);
      onClose();
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.message ?? "Не вдалося зберегти матеріал.",
        );
      } else {
        setError("Сталася невідома помилка.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onMouseDown={handleClose}>
      <div
        className="material-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{isEditMode ? "Редагувати матеріал" : "Додати матеріал"}</h2>

            <p>
              {isEditMode
                ? "Оновіть інформацію навчального матеріалу."
                : "Оберіть тип та заповніть інформацію про матеріал."}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={handleClose}
            disabled={isSaving || isRefreshing}
          >
            ×
          </button>
        </div>

        <form
  className="material-form"
  onSubmit={handleSubmit}
  noValidate
>
          {!isEditMode && (
            <div className="material-type-selector">
              <button
                type="button"
                className={
                  type === CourseMaterialType.Text
                    ? "material-type-option active"
                    : "material-type-option"
                }
                onClick={() => setType(CourseMaterialType.Text)}
              >
                Текст
              </button>

              <button
                type="button"
                className={
                  type === CourseMaterialType.File
                    ? "material-type-option active"
                    : "material-type-option"
                }
                onClick={() => setType(CourseMaterialType.File)}
              >
                Файл
              </button>

              <button
                type="button"
                className={
                  type === CourseMaterialType.Link
                    ? "material-type-option active"
                    : "material-type-option"
                }
                onClick={() => setType(CourseMaterialType.Link)}
              >
                Посилання
              </button>
            </div>
          )}

          {isEditMode && (
            <div className="material-current-type">
              Тип матеріалу:{" "}
              <strong>
                {type === CourseMaterialType.Text
                  ? "Текст"
                  : type === CourseMaterialType.File
                    ? "Файл"
                    : "Посилання"}
              </strong>
            </div>
          )}

          <FormField
  id="materialTitle"
  label="Назва матеріалу"
  required
  error={errors.title}
>
  <input
    id="materialTitle"
    value={title}
    maxLength={200}
    aria-invalid={!!errors.title}
    aria-describedby={
      errors.title ? "materialTitle-error" : undefined
    }
    onBlur={() => {
      setErrors((current) => ({
        ...current,
        title: validateRequired(title, "Назва матеріалу"),
      }));
    }}
    onChange={(event) => {
      const value = event.target.value;
      setTitle(value);

      if (errors.title) {
        setErrors((current) => ({
          ...current,
          title: validateRequired(value, "Назва матеріалу"),
        }));
      }
    }}
    placeholder="Наприклад, Лекція 1"
  />
</FormField>

        {type === CourseMaterialType.Text && (
  <FormField
    id="textContent"
    label="Текст матеріалу"
    required
    error={errors.textContent}
  >
    <textarea
      id="textContent"
      value={textContent}
      rows={9}
      placeholder="Введіть навчальний матеріал..."
      aria-invalid={!!errors.textContent}
      aria-describedby={
        errors.textContent ? "textContent-error" : undefined
      }
      onBlur={() => {
        setErrors((current) => ({
          ...current,
          textContent: validateRequired(
            textContent,
            "Текст матеріалу",
          ),
        }));
      }}
      onChange={(event) => {
        const value = event.target.value;
        setTextContent(value);

        if (errors.textContent) {
          setErrors((current) => ({
            ...current,
            textContent: validateRequired(
              value,
              "Текст матеріалу",
            ),
          }));
        }
      }}
    />
  </FormField>
)}

          {type === CourseMaterialType.Link && (
            <div className="form-group">
   <FormField
      id="materialUrl"
      label="Посилання"
      required
      error={errors.url}
      hint="Підтримуються публічні HTTPS-ресурси: HTML, PDF, TXT і DOCX."
    >
      <input
        id="materialUrl"
        type="url"
        value={url}
        placeholder="https://..."
        disabled={isSaving || isRefreshing}
        aria-invalid={!!errors.url}
        aria-describedby={
          errors.url
            ? "materialUrl-error"
            : "materialUrl-hint"
        }
        onBlur={() => {
          setErrors((current) => ({
            ...current,
            url: validateHttpsUrl(url),
          }));
        }}
        onChange={(event) => {
          const value = event.target.value;
          setUrl(value);

          if (errors.url) {
            setErrors((current) => ({
              ...current,
              url: validateHttpsUrl(value),
            }));
          }
        }}
      />
    </FormField>

            

             

              {isEditMode && material && (
                <div className="material-snapshot-refresh">
                  <div className="material-snapshot-info">
                    <strong>Вміст зовнішнього ресурсу</strong>

                    <p>
                      Перевірте й оновіть збережений вміст посилання, якщо
                      джерело змінилося.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="material-snapshot-refresh-button"
                    onClick={handleRefreshSnapshot}
                    disabled={
                      isSaving ||
                      isRefreshing ||
                      url.trim() !== (material.url ?? "").trim()
                    }
                    title={
                      url.trim() !== (material.url ?? "").trim()
                        ? "Спочатку збережіть змінений URL"
                        : "Перевірити актуальний вміст посилання"
                    }
                  >
                    <RefreshCw
                      size={17}
                      className={isRefreshing ? "material-refresh-spin" : ""}
                    />

                    {isRefreshing ? "Перевірка вмісту..." : "Оновити вміст"}
                  </button>
                </div>
              )}
            </div>
          )}

         {type === CourseMaterialType.File && (
  <FormField
    id="materialFile"
    label={isEditMode ? "Замінити файл" : "Файл"}
    required={!isEditMode}
    error={errors.file}
    hint={
      isEditMode
        ? "Оберіть новий файл, лише якщо хочете замінити поточний."
        : "Оберіть навчальний матеріал для завантаження."
    }
  >
    <>
      {isEditMode && material?.originalFileName && (
        <div className="current-file">
          Поточний файл:{" "}
          <strong>{material.originalFileName}</strong>
        </div>
      )}

      <label
        htmlFor="materialFile"
        className={`file-upload-area ${
          errors.file ? "file-upload-area--error" : ""
        }`}
      >
        <input
          id="materialFile"
          type="file"
          hidden
          disabled={isSaving || isRefreshing}
          aria-invalid={!!errors.file}
          aria-describedby={
            errors.file
              ? "materialFile-error"
              : "materialFile-hint"
          }
          onChange={(event) => {
            const selectedFile = event.target.files?.[0];
            setFile(selectedFile);

            setErrors((current) => ({
              ...current,
              file: validateFile(selectedFile, {
                required: !isEditMode,
              }),
            }));
          }}
        />

        {file ? (
          <>
            <strong>{file.name}</strong>
            <span>
              Файл буде завантажено після збереження
            </span>
          </>
        ) : (
          <>
            <strong>Обрати файл</strong>
            <span>
              Натисніть, щоб вибрати файл
            </span>
          </>
        )}
      </label>
    </>
  </FormField>
)}

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleClose}
              disabled={isSaving || isRefreshing}
            >
              Скасувати
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={isSaving || isRefreshing}
            >
              {isSaving
                ? "Збереження..."
                : isEditMode
                  ? "Зберегти"
                  : "Додати матеріал"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MaterialModal;
