import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { getMyCourses } from '../api/coursesApi'
import {
  CourseVisibility,
  type Course,
} from '../types/course'
import CreateCourseModal from '../components/CreateCourseModal'


function CoursesPage() {
  const navigate = useNavigate()

  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false)

    const handleCourseCreated = (course: Course) => {
  setCourses((currentCourses) => [
    course,
    ...currentCourses,
  ])
}

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await getMyCourses()

        setCourses(data)
      } catch (error) {
        if (
          error instanceof AxiosError &&
          error.response?.status === 401
        ) {
          localStorage.removeItem('token')
          navigate('/login')
          return
        }

        setError('Не вдалося завантажити курси.')
      } finally {
        setIsLoading(false)
      }
    }

    loadCourses()
  }, [navigate])

  if (isLoading) {
    return (
      <div className="page">
        <p>Завантаження курсів...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="form-error">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Мої курси</h1>
          <p>Керуйте навчальними курсами та матеріалами</p>
        </div>

        <button
          className="primary-button create-course-button"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Створити курс
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <h3>Курсів поки немає</h3>
          <p>
            Створіть перший курс, щоб почати роботу.
          </p>
        </div>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <Link
              to={`/courses/${course.id}`}
              key={course.id}
              className="course-card"
            >
              <div className="course-card-icon">
                {course.title.charAt(0).toUpperCase()}
              </div>

              <div className="course-card-content">
                <h2>{course.title}</h2>
                  <div className="course-visibility">
                    {course.visibility === CourseVisibility.Public ? (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M7 10V8a5 5 0 0 1 9.5-2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />

                          <rect
                            x="5"
                            y="10"
                            width="14"
                            height="10"
                            rx="2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                        </svg>

                        <span>Публічний</span>
                      </>
                    ) : (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M8 10V7a4 4 0 0 1 8 0v3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />

                          <rect
                            x="5"
                            y="10"
                            width="14"
                            height="10"
                            rx="2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                        </svg>

                        <span>Приватний</span>
                      </>
                    )}
                  </div>
                <p>
                  {course.description ||
                    'Опис курсу відсутній.'}
                </p>

                <div className="course-card-footer">
                  <span>
                    {course.createdByUserName}
                  </span>

                  <span className="course-link">
                    Відкрити →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCourseCreated}
      />
    </div>
  )
}

export default CoursesPage