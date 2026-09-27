import { Link } from "react-router-dom";

const courses = [
  {
    id: 1,
    title: "Основи програмування",
    description: "Вивчення базових принципів програмування та алгоритмізації.",
    students: 24,
  },
  {
    id: 2,
    title: "Веб-технології",
    description: "Основи створення сучасних вебзастосунків.",
    students: 18,
  },
  {
    id: 3,
    title: "Бази даних",
    description: "Проєктування та використання реляційних баз даних.",
    students: 31,
  },
];

function CoursesPage() {
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

      <div className="course-grid">
        {courses.map((course) => (
          <Link
            to={`/courses/${course.id}`}
            key={course.id}
            className="course-card"
          >
            <div className="course-card-icon">{course.title.charAt(0)}</div>

            <div className="course-card-content">
              <h2>{course.title}</h2>

              <p>{course.description}</p>

              <div className="course-card-footer">
                <span>{course.students} студентів</span>

                <span className="course-link">Відкрити →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default CoursesPage;
