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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!course) {
      return;
    }

    // setError('')
    //setSuccess('')
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
    if (!course) {
      return;
    }

    const handleArchive = async () => {
      if (!course) {
        return;
      }

      setIsArchiving(true);

      try {
        await archiveCourse(course.id);

        showToast("Курс архівовано.", "success");

        setIsArchiveModalOpen(false);

        navigate("/courses");
      } catch {
        showToast("Не вдалося архівувати курс.", "error");
      } finally {
        setIsArchiving(false);
      }
    };

    setIsArchiving(true);

    try {
      await archiveCourse(course.id);

      showToast("Курс архівовано.", "success");
      navigate("/courses");
    } catch {
      //setError('Не вдалося архівувати курс.')

      showToast("Не вдалося архівувати курс.", "error");
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

      <form className="course-settings-form" onSubmit={handleSave}>
        <section className="settings-section">
          <h2>Основна інформація</h2>

          <div className="form-group">
            <label htmlFor="courseTitle">Назва</label>

            <input
              id="courseTitle"
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="courseDescription">Опис</label>

            <textarea
              id="courseDescription"
              value={description}
              maxLength={2000}
              rows={7}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

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
              <label className="secondary-button">
                Обрати зображення
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </label>

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
