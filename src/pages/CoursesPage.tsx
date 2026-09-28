import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { getMyCourses } from '../api/coursesApi'
import type { Course } from '../types/course'

function CoursesPage() {
  const navigate = useNavigate()

  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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

        <button className="primary-button create-course-button">
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
    </div>
  )
}

export default CoursesPage