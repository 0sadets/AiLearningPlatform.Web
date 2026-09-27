import { Link, useParams } from 'react-router-dom'

function CourseDetailsPage() {
  const { id } = useParams()

  return (
    <div className="page">
      <Link to="/courses" className="back-link">
        ← Назад до курсів
      </Link>

      <div className="course-details-header">
        <div>
          <span className="course-label">
            Курс #{id}
          </span>

          <h1>Основи програмування</h1>

          <p>
            Вивчення базових принципів програмування та алгоритмізації.
          </p>
        </div>

        <button className="secondary-button">
          Налаштування
        </button>
      </div>

      <div className="course-statistics">
        <div className="stat-card">
          <span>Студенти</span>
          <strong>24</strong>
        </div>

        <div className="stat-card">
          <span>Матеріали</span>
          <strong>8</strong>
        </div>

        <div className="stat-card">
          <span>Тести</span>
          <strong>3</strong>
        </div>
      </div>

      <section className="content-section">
        <div className="section-header">
          <div>
            <h2>Навчальні матеріали</h2>
            <p>Матеріали та ресурси курсу</p>
          </div>

          <button className="secondary-button">
            + Додати матеріал
          </button>
        </div>

        <div className="empty-state">
          <h3>Матеріалів поки немає</h3>

          <p>
            Додайте перший навчальний матеріал до курсу.
          </p>
        </div>
      </section>
    </div>
  )
}

export default CourseDetailsPage