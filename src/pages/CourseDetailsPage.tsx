import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../styles/course-details.css";
import { joinPublicCourse, leavePublicCourse } from "../api/enrollmentsApi";

import { useToast } from "../context/ToastContext";
import { getCourseById, getCourseMaterials } from "../api/coursesApi";
import TextMaterialModal from "../components/TextMaterialModal";
import { CourseVisibility, type CourseDetails } from "../types/course";

import {
  CourseMaterialType,
  type CourseMaterial,
} from "../types/courseMaterial";

import MaterialModal from "../components/MaterialModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

import { deleteCourseMaterial } from "../api/coursesApi";
import { BookOpen, ExternalLink, Pencil, Trash2 } from "lucide-react";
import CourseParticipantsSection from "../components/CourseParticipantsSection";

function CourseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetails | null>(null);

  const [materials, setMaterials] = useState<CourseMaterial[]>([]);

  const [readingMaterial, setReadingMaterial] = useState<CourseMaterial | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  //const [error, setError] = useState('')

  const [isEnrollmentProcessing, setIsEnrollmentProcessing] = useState(false);

  const { showToast } = useToast();

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(
    null,
  );

  const [deletingMaterial, setDeletingMaterial] =
    useState<CourseMaterial | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleJoinCourse = async () => {
    if (!course) {
      return;
    }

    setIsEnrollmentProcessing(true);

    try {
      await joinPublicCourse(course.id);

      setCourse((current) =>
        current
          ? {
              ...current,
              isEnrolled: true,
              studentsCount: current.studentsCount + 1,
            }
          : current,
      );

      showToast("Ви успішно приєдналися до курсу.", "success");
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;

        if (typeof message === "string") {
          showToast(message, "error");
          return;
        }
      }

      showToast("Не вдалося приєднатися до курсу.", "error");
    } finally {
      setIsEnrollmentProcessing(false);
    }
  };
  const handleLeaveCourse = async () => {
    if (!course) {
      return;
    }

    setIsEnrollmentProcessing(true);

    try {
      await leavePublicCourse(course.id);

      setCourse((current) =>
        current
          ? {
              ...current,
              isEnrolled: false,
              studentsCount: Math.max(current.studentsCount - 1, 0),
            }
          : current,
      );

      showToast("Ви вийшли з курсу.", "success");
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;

        if (typeof message === "string") {
          showToast(message, "error");
          return;
        }
      }

      showToast("Не вдалося вийти з курсу.", "error");
    } finally {
      setIsEnrollmentProcessing(false);
    }
  };
  const handleEditMaterial = (material: CourseMaterial) => {
    setEditingMaterial(material);
    setIsMaterialModalOpen(true);
  };
  const handleCreateMaterial = () => {
    setEditingMaterial(null);
    setIsMaterialModalOpen(true);
  };

  const handleMaterialSaved = (savedMaterial: CourseMaterial) => {
    setMaterials((current) => {
      const exists = current.some((item) => item.id === savedMaterial.id);

      if (exists) {
        return current.map((item) =>
          item.id === savedMaterial.id ? savedMaterial : item,
        );
      }

      return [...current, savedMaterial].sort((a, b) => a.order - b.order);
    });

    if (!editingMaterial) {
      setCourse((current) =>
        current
          ? {
              ...current,
              materialsCount: current.materialsCount + 1,
            }
          : current,
      );
    }

    setEditingMaterial(null);
  };
  const handleDeleteMaterial = async () => {
    if (!deletingMaterial || !course) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteCourseMaterial(course.id, deletingMaterial.id);

      setMaterials((current) =>
        current.filter((item) => item.id !== deletingMaterial.id),
      );

      setCourse((current) =>
        current
          ? {
              ...current,
              materialsCount: Math.max(0, current.materialsCount - 1),
            }
          : current,
      );

      setDeletingMaterial(null);
    } catch {
      showToast("Не вдалося видалити матеріал.", "error");
    } finally {
      setIsDeleting(false);
    }
  };
  useEffect(() => {
    const loadCourse = async () => {
      const courseId = Number(id);

      if (!courseId) {
        showToast("Некоректний ідентифікатор курсу.", "error");

        setIsLoading(false);
        return;
      }

      try {
        const courseData = await getCourseById(courseId);

        setCourse(courseData);

        if (courseData.isOwner || courseData.isEnrolled) {
          const materialsData = await getCourseMaterials(courseId);

          setMaterials(materialsData);
        } else {
          setMaterials([]);
        }
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          showToast("Курс не знайдено.", "error");
        } else {
          showToast("Не вдалося завантажити курс.", "error");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [id, showToast]);
  if (isLoading) {
    return (
      <div className="page">
        <p>Завантаження курсу...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page">
        <button
          type="button"
          className="back-link"
          onClick={() => navigate(-1)}
        >
          ← Назад
        </button>

        <div className="form-error">{"Курс не знайдено."}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <section className="course-overview">
        <div className="course-cover">
          {course.imageUrl ? (
            <img src={course.imageUrl} alt={course.title} />
          ) : (
            <div className="course-cover-placeholder">
              {course.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="course-overview-content">
          <div className="course-overview-top">
            <div>
              <div className="course-meta">
                <span>
                  {course.visibility === CourseVisibility.Public
                    ? "Публічний курс"
                    : "Приватний курс"}
                </span>

                <span>•</span>

                <span>{course.createdByUserName}</span>
              </div>

              <h1>{course.title}</h1>

              <p className="course-description">
                {course.description || "Опис курсу відсутній."}
              </p>
            </div>

            <div className="course-overview-actions">
              {!course.isOwner && !course.isEnrolled && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleJoinCourse}
                  disabled={isEnrollmentProcessing}
                >
                  {isEnrollmentProcessing ? "Приєднання..." : "Приєднатися"}
                </button>
              )}

              {!course.isOwner && course.isEnrolled && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleLeaveCourse}
                  disabled={isEnrollmentProcessing}
                >
                  {isEnrollmentProcessing ? "Вихід..." : "Вийти з курсу"}
                </button>
              )}

              {course.isOwner && (
                <Link
                  to={`/courses/${course.id}/settings`}
                  className="secondary-button"
                >
                  Налаштування
                </Link>
              )}
            </div>
          </div>

          <div className="course-created-date">
            Створено {new Date(course.createdAt).toLocaleDateString("uk-UA")}
          </div>
        </div>
      </section>

      <div className="course-statistics">
        <div className="stat-card">
          <span>Студенти</span>
          <strong>{course.studentsCount}</strong>
        </div>

        <div className="stat-card">
          <span>Матеріали</span>
          <strong>{course.materialsCount}</strong>
        </div>

        <div className="stat-card">
          <span>Тести</span>
          <strong>{course.testsCount}</strong>
        </div>
      </div>

      {course.isOwner && (
        <CourseParticipantsSection
          courseId={course.id}
          visibility={course.visibility}
          onEnrollmentRemoved={() => {
            setCourse((current) =>
              current
                ? {
                    ...current,
                    studentsCount: Math.max(current.studentsCount - 1, 0),
                  }
                : current,
            );
          }}
        />
      )}

      {(course.isOwner || course.isEnrolled) && (
        <section className="content-section">
          <div className="section-header">
            <div>
              <h2>Навчальні матеріали</h2>

              <p>Матеріали та ресурси курсу</p>
            </div>

            {course.isOwner && (
              <button
                className="secondary-button"
                onClick={handleCreateMaterial}
              >
                + Додати матеріал
              </button>
            )}
          </div>

          {materials.length === 0 ? (
            <div className="empty-state">
              <h3>Матеріалів поки немає</h3>

              <p>
                {course.isOwner
                  ? "Додайте перший навчальний матеріал до курсу."
                  : "Викладач ще не додав матеріали до курсу."}
              </p>
            </div>
          ) : (
            <div className="materials-list">
              {materials.map((material) => (
                <MaterialItem
                  key={material.id}
                  material={material}
                  onOpen={setReadingMaterial}
                  onEdit={handleEditMaterial}
                  onDelete={setDeletingMaterial}
                  canManage={course.isOwner}
                />
              ))}
            </div>
          )}
        </section>
      )}
      {!course.isOwner && !course.isEnrolled && (
        <section className="content-section">
          <div className="empty-state">
            <BookOpen size={32} />

            <h3>Матеріали доступні учасникам курсу</h3>

            <p>Приєднайтеся до курсу, щоб переглядати навчальні матеріали.</p>
          </div>
        </section>
      )}

      <MaterialModal
        isOpen={isMaterialModalOpen}
        courseId={course.id}
        material={editingMaterial}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setEditingMaterial(null);
        }}
        onSaved={handleMaterialSaved}
      />
      <TextMaterialModal
        material={readingMaterial}
        onClose={() => setReadingMaterial(null)}
      />
      <ConfirmDeleteModal
        isOpen={!!deletingMaterial}
        title={deletingMaterial?.title ?? ""}
        isDeleting={isDeleting}
        onCancel={() => setDeletingMaterial(null)}
        onConfirm={handleDeleteMaterial}
      />
    </div>
  );
}

interface MaterialItemProps {
  material: CourseMaterial;

  onOpen: (material: CourseMaterial) => void;
  onEdit: (material: CourseMaterial) => void;
  onDelete: (material: CourseMaterial) => void;
  canManage: boolean;
}

function MaterialItem({
  material,

  onOpen,
  onEdit,
  onDelete,
  canManage,
}: MaterialItemProps) {
  const getTypeName = () => {
    switch (material.type) {
      case CourseMaterialType.Text:
        return "Текст";

      case CourseMaterialType.File:
        return "Файл";

      case CourseMaterialType.Link:
        return "Посилання";

      default:
        return "Матеріал";
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) {
      return null;
    }

    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} КБ`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  };

  return (
    <div className="material-item">
      <div className="material-main">
        <div className="material-type">{getTypeName()}</div>

        <div className="material-info">
          <h3>{material.title}</h3>

          {material.type === CourseMaterialType.Text &&
            material.textContent && (
              <p className="material-text-preview">{material.textContent}</p>
            )}

          {material.type === CourseMaterialType.File &&
            material.originalFileName && (
              <p>
                {material.originalFileName}

                {material.fileSize && ` · ${formatFileSize(material.fileSize)}`}
              </p>
            )}

          {material.type === CourseMaterialType.Link && material.url && (
            <p className="material-url">{material.url}</p>
          )}
        </div>
      </div>

      <div className="material-actions">
        {material.type === CourseMaterialType.Text && material.textContent && (
          <button
            type="button"
            className="material-open-link"
            onClick={() => onOpen(material)}
          >
            <BookOpen size={15} />
            Читати
          </button>
        )}

        {material.type === CourseMaterialType.File && material.fileUrl && (
          <a
            href={material.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="material-open-link"
          >
            <ExternalLink size={15} />
            Відкрити
          </a>
        )}

        {material.type === CourseMaterialType.Link && material.url && (
          <a
            href={material.url}
            target="_blank"
            rel="noreferrer"
            className="material-open-link"
          >
            <ExternalLink size={15} />
            Перейти
          </a>
        )}

        {canManage && (
          <>
            <button
              type="button"
              className="material-icon-button"
              onClick={() => onEdit(material)}
              aria-label="Редагувати матеріал"
              title="Редагувати"
            >
              <Pencil size={16} />
            </button>

            <button
              type="button"
              className="material-icon-button material-icon-button-danger"
              onClick={() => onDelete(material)}
              aria-label="Видалити матеріал"
              title="Видалити"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default CourseDetailsPage;
