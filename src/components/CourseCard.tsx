import { Link } from 'react-router-dom'

import {
  CourseVisibility,
  type Course,
} from '../types/course'

interface CourseCardProps {
  course: Course
}

function CourseCard({
  course,
}: CourseCardProps) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="course-card"
    >
      <div className="course-card-cover">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.title}
          />
        ) : (
          <div className="course-card-cover-placeholder">
            {course.title
              .charAt(0)
              .toUpperCase()}
          </div>
        )}
      </div>

      <div className="course-card-content">
        <h2>{course.title}</h2>

        <div className="course-visibility">
          {course.visibility ===
          CourseVisibility.Public ? (
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
  )
}

export default CourseCard