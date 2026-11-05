import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import ConfirmArchiveModal from "../components/ConfirmArchiveModal";
import {
  archiveCourse,
  deleteCourseImage,
  getCourseById,
  updateCourse,
  updateCourseImage,
} from "../api/coursesApi";
import FormField from "../components/ui/FormField";

import {
  validateCourseTitle,
  validateCourseDescription,
  validateCourseImage,
  validateCourseForm,
  hasCourseFormErrors,
  type CourseFormErrors,
} from "../utils/courseValidation";
import { CourseVisibility, type CourseDetails } from "../types/course";

import "../styles/course-settings.css";

function CourseSettingsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [course, setCourse] = useState<CourseDetails | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<CourseVisibility>(
    CourseVisibility.Private,
  );

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<CourseFormErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  useEffect(() => {
    const loadCourse = async () => {
      const courseId = Number(id);

      if (!courseId) {
        //setError('Некоректний ідентифікатор курсу.')
        showToast("Некоректний ідентифікатор курсу.", "error");

        setIsLoading(false);
        return;
      }

      try {
        const data = await getCourseById(courseId);
        setErrors({});
        setCourse(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setVisibility(data.visibility);
        setImagePreview(data.imageUrl);
      } catch {
        // setError('Не вдалося завантажити курс.')
        showToast("Не вдалося завантажити курс.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [id]);
useEffect(() => {
  if (!selectedImage) return;

  const previewUrl = URL.createObjectURL(selectedImage);

  setImagePreview(previewUrl);

  return () => {
    URL.revokeObjectURL(previewUrl);
  };
}, [selectedImage]);
const handleImageChange = (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  const validationError = validateCourseImage(file);

  setErrors((current) => ({
    ...current,
    image: validationError,
  }));

  if (validationError) {
    event.target.value = "";
    return;
  }

  setSelectedImage(file);
  event.target.value = "";
};

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!course || isSaving) return;

    const nextErrors = validateCourseForm(title, description, selectedImage);

    setErrors(nextErrors);

    if (hasCourseFormErrors(nextErrors)) {
      return;
    }

    setIsSaving(true);

    try {
      const updated = await updateCourse(course.id, {
        title: title.trim(),
        description: description.trim(),
        visibility,
      });

      let finalImageUrl = course.imageUrl;

      if (selectedImage) {
        const imageResult = await updateCourseImage(course.id, selectedImage);

        finalImageUrl = imageResult.imageUrl;
      }

      setCourse({
        ...course,
        ...updated,
        imageUrl: finalImageUrl,
      });

      setImagePreview(finalImageUrl);
      setSelectedImage(null);

      showToast("Зміни курсу успішно збережено.", "success");

      navigate(`/courses/${course.id}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        showToast(
          error.response?.data?.message ?? "Не вдалося зберегти зміни.",
          "error",
        );
      } else {
        showToast("Сталася невідома помилка.", "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!course) {
      return;
    }

    try {
      await deleteCourseImage(course.id);

      setCourse({
        ...course,
        imageUrl: null,
      });

      setImagePreview(null);
      setSelectedImage(null);

      showToast("Зображення курсу видалено.", "success");
    } catch {
      showToast("Не вдалося видалити зображення.", "error");
    }
  };

  const handleArchive = async () => {
    if (!course || isArchiving) {
      return;
    }

    setIsArchiving(true);

    try {
      await archiveCourse(course.id);

      showToast("Курс архівовано.", "success");

      setIsArchiveModalOpen(false);

      navigate("/courses");
    } catch (error) {
      if (error instanceof AxiosError) {
        showToast(
          error.response?.data?.message ?? "Не вдалося архівувати курс.",
          "error",
        );
      } else {
        showToast("Не вдалося архівувати курс.", "error");
      }
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page">
        <p>Завантаження налаштувань...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page">
        <p>Курс не знайдено.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to={`/courses/${course.id}`} className="back-link">
        ← Назад до курсу
      </Link>

      <div className="page-header">
        <div>
          <h1>Налаштування курсу</h1>

          <p>Редагуйте основну інформацію та обкладинку курсу</p>
        </div>
      </div>

      <form className="course-settings-form" onSubmit={handleSave} noValidate>
        <section className="settings-section">
          <h2>Основна інформація</h2>

          <FormField
            id="courseTitle"
            label="Назва курсу"
            required
            error={errors.title}
            hint={`${title.length}/200 символів`}
          >
            <input
              id="courseTitle"
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
              value={description}
              maxLength={2000}
              rows={7}
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

          <div className="visibility-setting">
            <div>
              <strong>Публічний курс</strong>

              <p>
                Публічний курс доступний для самостійного приєднання
                користувачів.
              </p>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={visibility === CourseVisibility.Public}
                onChange={(event) =>
                  setVisibility(
                    event.target.checked
                      ? CourseVisibility.Public
                      : CourseVisibility.Private,
                  )
                }
              />

              <span className="switch-slider" />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h2>Обкладинка курсу</h2>

          <div className="course-image-settings">
            <div className="course-settings-image">
              {imagePreview ? (
                <img src={imagePreview} alt={course.title} />
              ) : (
                <div className="course-settings-image-placeholder">
                  {title.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="course-image-actions">
              <label
                className={`secondary-button ${
                  errors.image ? "course-image-button--error" : ""
                }`}
              >
                Обрати зображення
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  hidden
                  disabled={isSaving}
                  onChange={handleImageChange}
                />
              </label>
              {errors.image && (
                <p className="form-field-error" role="alert">
                  {errors.image}
                </p>
              )}
              {imagePreview && (
                <button
                  type="button"
                  className="danger-link-button"
                  onClick={handleDeleteImage}
                >
                  Видалити зображення
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="settings-save-row">
          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? "Збереження..." : "Зберегти зміни"}
          </button>
        </div>
      </form>

      <section className="settings-section danger-zone">
        <div>
          <h2>Архівування курсу</h2>

          <p>
            Архівований курс більше не буде активним, але його дані залишаться
            збереженими.
          </p>
        </div>

        <button
          type="button"
          className="archive-button"
          onClick={() => setIsArchiveModalOpen(true)}
        >
          Архівувати курс
        </button>
      </section>

      <ConfirmArchiveModal
        isOpen={isArchiveModalOpen}
        isArchiving={isArchiving}
        onCancel={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchive}
      />
    </div>
  );
}

export default CourseSettingsPage;
