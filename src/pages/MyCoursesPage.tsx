import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AxiosError } from "axios";
import CourseCard from "../components/CourseCard";
import { Archive, BookOpen, GraduationCap, Mail, Plus } from "lucide-react";

import {
  acceptInvitation,
  declineInvitation,
  getMyInvitations,
} from "../api/invitationsApi";

import { useToast } from "../context/ToastContext";
import { getMyEnrolledCourses } from "../api/enrollmentsApi";
import {
  CourseInvitationStatus,
  type CourseInvitation,
} from "../types/courseInvitation";
import { getMyCourses } from "../api/coursesApi";

import { type Course } from "../types/course";

import CreateCourseModal from "../components/CreateCourseModal";

import "../styles/my-courses.css";
import "../styles/courses.css";

type CourseTab = "enrolled" | "created" | "invitations" | "archived";

function MyCoursesPage() {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const tab = (searchParams.get("tab") as CourseTab) ?? "enrolled";

  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);

  const [isCreatedLoading, setIsCreatedLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const changeTab = (newTab: CourseTab) => {
    setSearchParams({
      tab: newTab,
    });
  };
  const { showToast } = useToast();

  const [processingInvitationId, setProcessingInvitationId] = useState<
    number | null
  >(null);

  const [invitations, setInvitations] = useState<CourseInvitation[]>([]);

  const [isInvitationsLoading, setIsInvitationsLoading] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);

  const [isEnrolledLoading, setIsEnrolledLoading] = useState(false);
  const handleCourseCreated = (course: Course) => {
    setCreatedCourses((current) => [course, ...current]);
  };

  const handleAcceptInvitation = async (invitationId: number) => {
    setProcessingInvitationId(invitationId);

    try {
      await acceptInvitation(invitationId);

      setInvitations((current) =>
        current.map((invitation) =>
          invitation.id === invitationId
            ? {
                ...invitation,
                status: CourseInvitationStatus.Accepted,
                respondedAt: new Date().toISOString(),
              }
            : invitation,
        ),
      );

      showToast("Запрошення прийнято. Курс додано до ваших курсів.", "success");
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;

        if (typeof message === "string") {
          showToast(message, "error");
          return;
        }
      }

      showToast("Не вдалося прийняти запрошення.", "error");
    } finally {
      setProcessingInvitationId(null);
    }
  };
  const handleDeclineInvitation = async (invitationId: number) => {
    setProcessingInvitationId(invitationId);

    try {
      await declineInvitation(invitationId);

      setInvitations((current) =>
        current.map((invitation) =>
          invitation.id === invitationId
            ? {
                ...invitation,
                status: CourseInvitationStatus.Declined,
                respondedAt: new Date().toISOString(),
              }
            : invitation,
        ),
      );

      showToast("Запрошення відхилено.", "success");
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;

        if (typeof message === "string") {
          showToast(message, "error");
          return;
        }
      }

      showToast("Не вдалося відхилити запрошення.", "error");
    } finally {
      setProcessingInvitationId(null);
    }
  };
  useEffect(() => {
    if (tab !== "enrolled") {
      return;
    }

    const loadEnrolledCourses = async () => {
      setIsEnrolledLoading(true);

      try {
        const data = await getMyEnrolledCourses();

        setEnrolledCourses(data);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        showToast("Не вдалося завантажити ваші курси.", "error");
      } finally {
        setIsEnrolledLoading(false);
      }
    };

    loadEnrolledCourses();
  }, [tab, navigate, showToast]);
  useEffect(() => {
    if (tab !== "invitations") {
      return;
    }

    const loadInvitations = async () => {
      setIsInvitationsLoading(true);

      try {
        const data = await getMyInvitations();

        setInvitations(data);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setIsInvitationsLoading(false);
      }
    };

    loadInvitations();
  }, [tab, navigate]);
  useEffect(() => {
    if (tab !== "created") {
      return;
    }

    const loadCreatedCourses = async () => {
      setIsCreatedLoading(true);

      try {
        const data = await getMyCourses();

        setCreatedCourses(data);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setIsCreatedLoading(false);
      }
    };

    loadCreatedCourses();
  }, [tab, navigate]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Мої курси</h1>

          <p>Навчайтеся та керуйте власними курсами</p>
        </div>
      </div>

      <div className="my-courses-tabs">
        <button
          type="button"
          className={
            tab === "enrolled" ? "my-courses-tab active" : "my-courses-tab"
          }
          onClick={() => changeTab("enrolled")}
        >
          <GraduationCap size={17} />
          Мої курси
        </button>

        <button
          type="button"
          className={
            tab === "created" ? "my-courses-tab active" : "my-courses-tab"
          }
          onClick={() => changeTab("created")}
        >
          <BookOpen size={17} />
          Створені мною
        </button>
        <button
          type="button"
          className={
            tab === "invitations" ? "my-courses-tab active" : "my-courses-tab"
          }
          onClick={() => changeTab("invitations")}
        >
          <Mail size={17} />
          Запрошення
        </button>
        <button
          type="button"
          className={
            tab === "archived" ? "my-courses-tab active" : "my-courses-tab"
          }
          onClick={() => changeTab("archived")}
        >
          <Archive size={17} />
          Архів
        </button>
      </div>

      {tab === "enrolled" && (
        <section className="my-courses-section">
          <div className="my-courses-section-header">
            <div>
              <h2>Мої курси</h2>

              <p>Курси, до яких ви приєдналися як студент.</p>
            </div>
          </div>

          {isEnrolledLoading ? (
            <p>Завантаження курсів...</p>
          ) : enrolledCourses.length === 0 ? (
            <div className="my-courses-empty">
              <GraduationCap size={32} />

              <h3>Ви ще не приєдналися до курсів</h3>

              <p>Перегляньте каталог та знайдіть курс для навчання.</p>

              <Link to="/courses" className="secondary-button">
                Переглянути курси
              </Link>
            </div>
          ) : (
            <div className="course-grid">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "created" && (
        <section className="my-courses-section">
          <div className="my-courses-section-header">
            <div>
              <h2>Створені мною</h2>

              <p>Курси, які ви створили та адмініструєте.</p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={17} />
              Створити курс
            </button>
          </div>

          {isCreatedLoading ? (
            <p>Завантаження курсів...</p>
          ) : createdCourses.length === 0 ? (
            <div className="my-courses-empty">
              <BookOpen size={32} />

              <h3>Створених курсів поки немає</h3>

              <p>
                Створіть перший курс та додайте до нього навчальні матеріали.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={17} />
                Створити курс
              </button>
            </div>
          ) : (
            <div className="course-grid">
              {createdCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      )}
      {tab === "invitations" && (
        <section className="my-courses-section">
          <div className="my-courses-section-header">
            <div>
              <h2>Запрошення</h2>

              <p>Запрошення приєднатися до приватних курсів.</p>
            </div>
          </div>

          {isInvitationsLoading ? (
            <p>Завантаження запрошень...</p>
          ) : invitations.length === 0 ? (
            <div className="my-courses-empty">
              <Mail size={32} />

              <h3>Запрошень поки немає</h3>

              <p>
                Тут з'являться запрошення від викладачів приєднатися до
                приватних курсів.
              </p>
            </div>
          ) : (
            <div className="invitations-list">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="invitation-card">
                  <div className="invitation-card-main">
                    <div>
                      <h3>{invitation.courseTitle}</h3>

                      <p>Запрошує: {invitation.invitedByUserName}</p>
                    </div>

                    <InvitationStatusBadge status={invitation.status} />
                  </div>

                  <div className="invitation-card-footer">
                    <span>
                      Отримано:{" "}
                      {new Date(invitation.createdAt).toLocaleDateString(
                        "uk-UA",
                      )}
                    </span>

                    {invitation.status === CourseInvitationStatus.Pending && (
                      <div className="invitation-card-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleDeclineInvitation(invitation.id)}
                          disabled={processingInvitationId === invitation.id}
                        >
                          Відхилити
                        </button>

                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          disabled={processingInvitationId === invitation.id}
                        >
                          {processingInvitationId === invitation.id
                            ? "Обробка..."
                            : "Прийняти"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {tab === "archived" && (
        <section className="my-courses-section">
          <div className="my-courses-section-header">
            <div>
              <h2>Архів</h2>

              <p>Курси, які були перенесені до архіву.</p>
            </div>
          </div>

          <div className="my-courses-empty">
            <Archive size={32} />

            <h3>Архів порожній</h3>

            <p>Архівовані курси з'являться тут.</p>
          </div>
        </section>
      )}

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCourseCreated}
      />
    </div>
  );
}
interface InvitationStatusBadgeProps {
  status: CourseInvitation["status"];
}

function InvitationStatusBadge({ status }: InvitationStatusBadgeProps) {
  const getLabel = () => {
    switch (status) {
      case CourseInvitationStatus.Pending:
        return "Очікує відповіді";

      case CourseInvitationStatus.Accepted:
        return "Прийнято";

      case CourseInvitationStatus.Declined:
        return "Відхилено";

      case CourseInvitationStatus.Expired:
        return "Термін минув";

      case CourseInvitationStatus.Cancelled:
        return "Скасовано";

      default:
        return "Невідомо";
    }
  };

  return (
    <span className={`invitation-badge invitation-badge-${status}`}>
      {getLabel()}
    </span>
  );
}
export default MyCoursesPage;
