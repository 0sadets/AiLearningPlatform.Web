import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { Link, useParams } from 'react-router-dom'
import '../styles/course-details.css'
import {
  getCourseById,
  getCourseMaterials,
} from '../api/coursesApi'
import TextMaterialModal from '../components/TextMaterialModal'
import {
  CourseVisibility,
  type CourseDetails,
} from '../types/course'

import {
  CourseMaterialType,
  type CourseMaterial,
} from '../types/courseMaterial'

import MaterialModal from '../components/MaterialModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'

import { deleteCourseMaterial } from '../api/coursesApi'
import { BookOpen, ExternalLink, Pencil, Trash2 } from 'lucide-react'

function CourseDetailsPage() {
  const { id } = useParams()

  const [course, setCourse] =
    useState<CourseDetails | null>(null)

  const [materials, setMaterials] =
    useState<CourseMaterial[]>([])

    const [readingMaterial, setReadingMaterial] =
  useState<CourseMaterial | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [isMaterialModalOpen, setIsMaterialModalOpen] =
  useState(false)

  const [editingMaterial, setEditingMaterial] =
    useState<CourseMaterial | null>(null)

  const [deletingMaterial, setDeletingMaterial] =
    useState<CourseMaterial | null>(null)

  const [isDeleting, setIsDeleting] =
    useState(false)

  const handleEditMaterial = (
    material: CourseMaterial,
  ) => {
    setEditingMaterial(material)
    setIsMaterialModalOpen(true)
  }
    const handleCreateMaterial = () => {
    setEditingMaterial(null)
    setIsMaterialModalOpen(true)
  }

  const handleMaterialSaved = (
    savedMaterial: CourseMaterial,
  ) => {
    setMaterials((current) => {
      const exists = current.some(
        (item) => item.id === savedMaterial.id,
      )

      if (exists) {
        return current.map((item) =>
          item.id === savedMaterial.id
            ? savedMaterial
            : item,
        )
      }

      return [...current, savedMaterial].sort(
        (a, b) => a.order - b.order,
      )
    })

    if (!editingMaterial) {
      setCourse((current) =>
        current
          ? {
              ...current,
              materialsCount:
                current.materialsCount + 1,
            }
          : current,
      )
    }

    setEditingMaterial(null)
  }
const handleDeleteMaterial = async () => {
  if (!deletingMaterial || !course) {
    return
  }

  setIsDeleting(true)

  try {
    await deleteCourseMaterial(
      course.id,
      deletingMaterial.id,
    )

    setMaterials((current) =>
      current.filter(
        (item) =>
          item.id !== deletingMaterial.id,
      ),
    )

    setCourse((current) =>
      current
        ? {
            ...current,
            materialsCount: Math.max(
              0,
              current.materialsCount - 1,
            ),
          }
        : current,
    )

    setDeletingMaterial(null)
  } catch {
    setError('Не вдалося видалити матеріал.')
  } finally {
    setIsDeleting(false)
  }
}
  useEffect(() => {
    const loadCourse = async () => {
      const courseId = Number(id)

      if (!courseId) {
        setError('Некоректний ідентифікатор курсу.')
        setIsLoading(false)
        return
      }

      try {
        const [courseData, materialsData] =
          await Promise.all([
            getCourseById(courseId),
            getCourseMaterials(courseId),
          ])

        setCourse(courseData)
        setMaterials(materialsData)
      } catch (error) {
        if (
          error instanceof AxiosError &&
          error.response?.status === 404
        ) {
          setError('Курс не знайдено.')
        } else {
          setError('Не вдалося завантажити курс.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadCourse()
  }, [id])

  if (isLoading) {
    return (
      <div className="page">
        <p>Завантаження курсу...</p>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="page">
        <Link to="/courses" className="back-link">
          ← Назад до курсів
        </Link>

        <div className="form-error">
          {error || 'Курс не знайдено.'}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Link to="/courses" className="back-link">
        ← Назад до курсів
      </Link>

      <section className="course-overview">
        <div className="course-cover">
          {course.imageUrl ? (
            <img
              src={course.imageUrl}
              alt={course.title}
            />
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
                    ? 'Публічний курс'
                    : 'Приватний курс'}
                </span>

                <span>•</span>

                <span>
                  {course.createdByUserName}
                </span>
              </div>

              <h1>{course.title}</h1>

              <p className="course-description">
                {course.description ||
                  'Опис курсу відсутній.'}
              </p>
            </div>

           <Link
              to={`/courses/${course.id}/settings`}
              className="secondary-button"
            >
              Налаштування
            </Link>
          </div>

          <div className="course-created-date">
            Створено{' '}
            {new Date(course.createdAt).toLocaleDateString(
              'uk-UA',
            )}
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

      <section className="content-section">
        <div className="section-header">
          <div>
            <h2>Навчальні матеріали</h2>

            <p>
              Матеріали та ресурси курсу
            </p>
          </div>

         <button
        className="secondary-button"
        onClick={handleCreateMaterial}
      >
        + Додати матеріал
      </button>
        </div>

        {materials.length === 0 ? (
          <div className="empty-state">
            <h3>Матеріалів поки немає</h3>

            <p>
              Додайте перший навчальний матеріал до курсу.
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
            />
            ))}
          </div>
        )}
      </section>



      <MaterialModal
        isOpen={isMaterialModalOpen}
        courseId={course.id}
        material={editingMaterial}
        onClose={() => {
          setIsMaterialModalOpen(false)
          setEditingMaterial(null)
        }}
        onSaved={handleMaterialSaved}
      />
      <TextMaterialModal
        material={readingMaterial}
        onClose={() => setReadingMaterial(null)}
      />
      <ConfirmDeleteModal
        isOpen={!!deletingMaterial}
        title={deletingMaterial?.title ?? ''}
        isDeleting={isDeleting}
        onCancel={() => setDeletingMaterial(null)}
        onConfirm={handleDeleteMaterial}
      />
    </div>
  )
}


interface MaterialItemProps {
  material: CourseMaterial

  onOpen: (material: CourseMaterial) => void
  onEdit: (material: CourseMaterial) => void
  onDelete: (material: CourseMaterial) => void
}

function MaterialItem({
  material,

  onOpen,
  onEdit,
  onDelete,
}: MaterialItemProps) {
  const getTypeName = () => {
    switch (material.type) {
      case CourseMaterialType.Text:
        return 'Текст'

      case CourseMaterialType.File:
        return 'Файл'

      case CourseMaterialType.Link:
        return 'Посилання'

      default:
        return 'Матеріал'
    }
  }

  const formatFileSize = (
    bytes: number | null,
  ) => {
    if (!bytes) {
      return null
    }

    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} КБ`
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
  }

  return (
    <div className="material-item">
      <div className="material-main">
        <div className="material-type">
          {getTypeName()}
        </div>

        <div className="material-info">
          <h3>{material.title}</h3>

          {material.type === CourseMaterialType.Text &&
            material.textContent && (
              <p className="material-text-preview">
                {material.textContent}
              </p>
            )}

          {material.type === CourseMaterialType.File &&
            material.originalFileName && (
              <p>
                {material.originalFileName}

                {material.fileSize &&
                  ` · ${formatFileSize(material.fileSize)}`}
              </p>
            )}

          {material.type === CourseMaterialType.Link &&
            material.url && (
              <p className="material-url">
                {material.url}
              </p>
            )}
        </div>
      </div>

      <div className="material-actions">
  {material.type === CourseMaterialType.Text &&
    material.textContent && (
      <button
        type="button"
        className="material-open-link"
        onClick={() => onOpen(material)}
      >
        <BookOpen size={15} />
        Читати
      </button>
    )}

  {material.type === CourseMaterialType.File &&
    material.fileUrl && (
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

  {material.type === CourseMaterialType.Link &&
    material.url && (
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
</div>


    </div>
  )
}

export default CourseDetailsPage