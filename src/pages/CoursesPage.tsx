import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { BookOpen, Search, SlidersHorizontal } from "lucide-react";

import CourseCard from "../components/CourseCard";

import { getPublicCourses } from "../api/coursesApi";

import type { Course } from "../types/course";

import { useToast } from "../context/ToastContext";

import "../styles/courses.css";

function CoursesPage() {
  const { showToast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      setIsLoading(true);

      try {
        const data = await getPublicCourses();

        setCourses(data);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }

        showToast("Не вдалося завантажити публічні курси.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, [showToast]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Курси</h1>

          <p>Знаходьте навчальні курси та приєднуйтеся до них</p>
        </div>
      </div>

      <div className="catalog-toolbar">
        <div className="catalog-search">
          <Search size={18} />

          <input type="text" placeholder="Пошук курсів..." disabled />
        </div>

        <button type="button" className="catalog-filter-button" disabled>
          <SlidersHorizontal size={17} />
          Фільтри
        </button>
      </div>

      <section className="catalog-section">
        <div className="catalog-section-header">
          <div>
            <h2>Усі курси</h2>

            <p>Доступні публічні навчальні курси</p>
          </div>
        </div>

        {isLoading ? (
          <p>Завантаження курсів...</p>
        ) : courses.length === 0 ? (
          <div className="catalog-empty">
            <BookOpen size={34} />

            <h3>Каталог курсів поки порожній</h3>

            <p>Публічні курси з'являться тут, коли викладачі їх опублікують.</p>
          </div>
        ) : (
          <div className="course-grid">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default CoursesPage;
