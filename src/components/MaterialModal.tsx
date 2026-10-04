import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'

import {
  createCourseMaterial,
  updateCourseMaterial,
} from '../api/coursesApi'

import {
  CourseMaterialType,
  type CourseMaterial,
} from '../types/courseMaterial'

import '../styles/material-modal.css'

interface MaterialModalProps {
  isOpen: boolean
  courseId: number
  material?: CourseMaterial | null
  onClose: () => void
  onSaved: (material: CourseMaterial) => void
}

function MaterialModal({
  isOpen,
  courseId,
  material,
  onClose,
  onSaved,
}: MaterialModalProps) {
  const isEditMode = !!material

  const [title, setTitle] = useState('')
  const [type, setType] =
  useState<CourseMaterialType>(
    CourseMaterialType.Text,
  )

  const [textContent, setTextContent] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | undefined>()

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (material) {
      setTitle(material.title)
      setType(material.type) 
      setTextContent(material.textContent ?? '')
      setUrl(material.url ?? '')
      setFile(undefined)
    } else {
      setTitle('')
      setType(CourseMaterialType.Text)
      setTextContent('')
      setUrl('')
      setFile(undefined)
    }

    setError('')
  }, [isOpen, material])

  const handleClose = () => {
    if (isSaving) {
      return
    }

    onClose()
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError('Вкажіть назву матеріалу.')
      return
    }

    if (
      type === CourseMaterialType.Text &&
      !textContent.trim()
    ) {
      setError('Додайте текст матеріалу.')
      return
    }

    if (
      type === CourseMaterialType.Link &&
      !url.trim()
    ) {
      setError('Вкажіть посилання.')
      return
    }

    if (
      !isEditMode &&
      type === CourseMaterialType.File &&
      !file
    ) {
      setError('Оберіть файл.')
      return
    }

    setError('')
    setIsSaving(true)

    try {
      let savedMaterial: CourseMaterial

      if (material) {
        savedMaterial = await updateCourseMaterial(
          courseId,
          material.id,
          {
            title: trimmedTitle,

            textContent:
              type === CourseMaterialType.Text
                ? textContent.trim()
                : undefined,

            url:
              type === CourseMaterialType.Link
                ? url.trim()
                : undefined,

            file:
              type === CourseMaterialType.File
                ? file
                : undefined,
          },
        )
      } else {
        savedMaterial = await createCourseMaterial(
          courseId,
          {
            title: trimmedTitle,
            type,

            textContent:
              type === CourseMaterialType.Text
                ? textContent.trim()
                : undefined,

            url:
              type === CourseMaterialType.Link
                ? url.trim()
                : undefined,

            file:
              type === CourseMaterialType.File
                ? file
                : undefined,
          },
        )
      }

      onSaved(savedMaterial)
      onClose()
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.message ??
            'Не вдалося зберегти матеріал.',
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
        className="material-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <h2>
              {isEditMode
                ? 'Редагувати матеріал'
                : 'Додати матеріал'}
            </h2>

            <p>
              {isEditMode
                ? 'Оновіть інформацію навчального матеріалу.'
                : 'Оберіть тип та заповніть інформацію про матеріал.'}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={handleClose}
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        <form
          className="material-form"
          onSubmit={handleSubmit}
        >
          {!isEditMode && (
            <div className="material-type-selector">
              <button
                type="button"
                className={
                  type === CourseMaterialType.Text
                    ? 'material-type-option active'
                    : 'material-type-option'
                }
                onClick={() =>
                  setType(CourseMaterialType.Text)
                }
              >
                Текст
              </button>

              <button
                type="button"
                className={
                  type === CourseMaterialType.File
                    ? 'material-type-option active'
                    : 'material-type-option'
                }
                onClick={() =>
                  setType(CourseMaterialType.File)
                }
              >
                Файл
              </button>

              <button
                type="button"
                className={
                  type === CourseMaterialType.Link
                    ? 'material-type-option active'
                    : 'material-type-option'
                }
                onClick={() =>
                  setType(CourseMaterialType.Link)
                }
              >
                Посилання
              </button>
            </div>
          )}

          {isEditMode && (
            <div className="material-current-type">
              Тип матеріалу:{' '}
              <strong>
                {type === CourseMaterialType.Text
                  ? 'Текст'
                  : type === CourseMaterialType.File
                    ? 'Файл'
                    : 'Посилання'}
              </strong>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="materialTitle">
              Назва
            </label>

            <input
              id="materialTitle"
              value={title}
              maxLength={200}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Наприклад, Лекція 1"
              required
            />
          </div>

          {type === CourseMaterialType.Text && (
            <div className="form-group">
              <label htmlFor="textContent">
                Текст матеріалу
              </label>

              <textarea
                id="textContent"
                value={textContent}
                onChange={(event) =>
                  setTextContent(event.target.value)
                }
                placeholder="Введіть навчальний матеріал..."
                rows={9}
              />
            </div>
          )}

          {type === CourseMaterialType.Link && (
            <div className="form-group">
              <label htmlFor="materialUrl">
                Посилання
              </label>

              <input
                id="materialUrl"
                type="url"
                value={url}
                onChange={(event) =>
                  setUrl(event.target.value)
                }
                placeholder="https://..."
              />
            </div>
          )}

          {type === CourseMaterialType.File && (
            <div className="form-group">
              <label>
                {isEditMode
                  ? 'Замінити файл'
                  : 'Файл'}
              </label>

              {isEditMode &&
                material?.originalFileName && (
                  <div className="current-file">
                    Поточний файл:{' '}
                    <strong>
                      {material.originalFileName}
                    </strong>
                  </div>
                )}

              <label className="file-upload-area">
                <input
                  type="file"
                  hidden
                  onChange={(event) =>
                    setFile(
                      event.target.files?.[0],
                    )
                  }
                />

                {file ? (
                  <>
                    <strong>{file.name}</strong>
                    <span>
                      Файл буде завантажено після
                      збереження
                    </span>
                  </>
                ) : (
                  <>
                    <strong>
                      Обрати файл
                    </strong>

                    <span>
                      Натисніть, щоб вибрати файл
                    </span>
                  </>
                )}
              </label>
            </div>
          )}

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
                ? 'Збереження...'
                : isEditMode
                  ? 'Зберегти'
                  : 'Додати матеріал'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MaterialModal