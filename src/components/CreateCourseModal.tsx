import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'

import { createCourse } from '../api/coursesApi'
import FormField from "./ui/FormField";

import {
  validateCourseTitle,
  validateCourseDescription,
  validateCourseForm,
  hasCourseFormErrors,
  type CourseFormErrors,
} from "../utils/courseValidation";
import {
  CourseVisibility,
  type Course,
} from '../types/course'

interface CreateCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (course: Course) => void
}

function CreateCourseModal({
  isOpen,
  onClose,
  onCreated,
}: CreateCourseModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
const [errors, setErrors] = useState<CourseFormErrors>({});
 useEffect(() => {
  if (!isOpen) return;

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !isSaving) {
      resetForm();
      onClose();
    }
  };

  document.addEventListener("keydown", handleEscape);

  return () => {
    document.removeEventListener("keydown", handleEscape);
  };
}, [isOpen, isSaving, onClose]);
  const resetForm = () => {
    setTitle('')
    setDescription('')
    setIsPublic(false)
    setError('')
    setErrors({});
  }

  const handleClose = () => {
    if (isSaving) {
      return
    }

    resetForm()
    onClose()
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (isSaving) return;

const nextErrors = validateCourseForm(title, description);

setErrors(nextErrors);

if (hasCourseFormErrors(nextErrors)) {
  return;
}

const trimmedTitle = title.trim();

setError('');
setIsSaving(true);

    try {
      const course = await createCourse({
        title: trimmedTitle,
        description: description.trim() || undefined,
        visibility: isPublic
          ? CourseVisibility.Public
          : CourseVisibility.Private,
      })

      onCreated(course)

      resetForm()
      onClose()
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.message ??
            'Не вдалося створити курс.',
        )
      } else {
        setError('Сталася невідома помилка.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleClose}
    >
      <div
        className="modal-container"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Створити курс</h2>

            <p>
              Вкажіть основну інформацію про новий навчальний курс.
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Закрити"
          >
            ×
          </button>
        </div>

        <form
          className="create-course-form"
          onSubmit={handleSubmit} noValidate
        >
        <FormField
  id="courseTitle"
  label="Назва курсу"
  required
  error={errors.title}
  hint={`${title.length}/200 символів`}
>
  <input
    id="courseTitle"
    type="text"
    placeholder="Наприклад, Основи програмування"
    value={title}
    maxLength={200}
    disabled={isSaving}
    aria-invalid={!!errors.title}
    aria-describedby={
      errors.title ? "courseTitle-error" : "courseTitle-hint"
    }
    onBlur={() => {
      setErrors((current) => ({
        ...current,
        title: validateCourseTitle(title),
      }));
    }}
    onChange={(event) => {
      const value = event.target.value;
      setTitle(value);

      if (errors.title) {
        setErrors((current) => ({
          ...current,
          title: validateCourseTitle(value),
        }));
      }
    }}
  />
</FormField>

       <FormField
  id="courseDescription"
  label="Опис"
  error={errors.description}
  hint={`${description.length}/2000 символів`}
>
  <textarea
    id="courseDescription"
    placeholder="Коротко опишіть зміст та мету курсу..."
    value={description}
    maxLength={2000}
    rows={5}
    disabled={isSaving}
    aria-invalid={!!errors.description}
    aria-describedby={
      errors.description
        ? "courseDescription-error"
        : "courseDescription-hint"
    }
    onBlur={() => {
      setErrors((current) => ({
        ...current,
        description: validateCourseDescription(description),
      }));
    }}
    onChange={(event) => {
      const value = event.target.value;
      setDescription(value);

      if (errors.description) {
        setErrors((current) => ({
          ...current,
          description: validateCourseDescription(value),
        }));
      }
    }}
  />
</FormField>

          <div className="visibility-option">
            <div className="visibility-option-content">
              <span className="visibility-title">
                Публічний курс
              </span>

              <span className="visibility-description">
                {isPublic
                  ? 'Користувачі зможуть самостійно приєднуватися до курсу.'
                  : 'Приєднатися до приватного курсу можна лише за запрошенням.'}
              </span>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) =>
                  setIsPublic(event.target.checked)
                }
              />

              <span className="switch-slider" />
            </label>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleClose}
              disabled={isSaving}
            >
              Скасувати
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={isSaving}
            >
              {isSaving
                ? 'Створення...'
                : 'Створити курс'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCourseModal