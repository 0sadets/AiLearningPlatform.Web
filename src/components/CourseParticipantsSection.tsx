import { useEffect, useState } from "react";
//import { AxiosError } from 'axios'
import { Trash2, X } from "lucide-react";
import InviteCourseMemberModal from "./InviteCourseMemberModal";
import {
  getCourseEnrollments,
  removeCourseEnrollment,
} from "../api/enrollmentsApi";

import {
  cancelCourseInvitation,
  getCourseInvitations,
} from "../api/invitationsApi";

import type { Enrollment } from "../types/enrollment";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { useToast } from "../context/ToastContext";
import {
  CourseInvitationStatus,
  type CourseInvitation,
} from "../types/courseInvitation";

import { CourseVisibility } from "../types/course";

interface CourseParticipantsSectionProps {
  courseId: number;
  visibility: CourseVisibility;
  onEnrollmentRemoved: () => void;
}

function CourseParticipantsSection({
  courseId,
  visibility,
  onEnrollmentRemoved,
}: CourseParticipantsSectionProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [invitations, setInvitations] = useState<CourseInvitation[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  const [cancellingInvitationId, setCancellingInvitationId] = useState<
    number | null
  >(null);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { showToast } = useToast();

  const [enrollmentToRemove, setEnrollmentToRemove] =
    useState<Enrollment | null>(null);

  const [invitationToCancel, setInvitationToCancel] =
    useState<CourseInvitation | null>(null);

  const isPrivate = visibility === CourseVisibility.Private;

  useEffect(() => {
    const loadParticipants = async () => {
      setIsLoading(true);
      setError("");

      try {
        if (isPrivate) {
          const [enrollmentsData, invitationsData] = await Promise.all([
            getCourseEnrollments(courseId),
            getCourseInvitations(courseId),
          ]);

          setEnrollments(enrollmentsData);
          setInvitations(invitationsData);
        } else {
          const enrollmentsData = await getCourseEnrollments(courseId);

          setEnrollments(enrollmentsData);
        }
      } catch {
        setError("Не вдалося завантажити учасників курсу.");
      } finally {
        setIsLoading(false);
      }
    };

    loadParticipants();
  }, [courseId, isPrivate]);

  const handleRemoveEnrollment = async () => {
    if (!enrollmentToRemove) {
      return;
    }

    setRemovingUserId(enrollmentToRemove.userId);

    try {
      await removeCourseEnrollment(courseId, enrollmentToRemove.userId);

      setEnrollments((current) =>
        current.filter((item) => item.userId !== enrollmentToRemove.userId),
      );

      onEnrollmentRemoved();

      showToast("Користувача видалено з курсу.", "success");

      setEnrollmentToRemove(null);
    } catch {
      showToast("Не вдалося видалити користувача з курсу.", "error");
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleCancelInvitation = async () => {
    if (!invitationToCancel) {
      return;
    }

    setCancellingInvitationId(invitationToCancel.id);

    try {
      await cancelCourseInvitation(courseId, invitationToCancel.id);

      setInvitations((current) =>
        current.map((item) =>
          item.id === invitationToCancel.id
            ? {
                ...item,
                status: CourseInvitationStatus.Cancelled,
                respondedAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      showToast("Запрошення скасовано.", "success");

      setInvitationToCancel(null);
    } catch {
      showToast("Не вдалося скасувати запрошення.", "error");
    } finally {
      setCancellingInvitationId(null);
    }
  };

  const getInvitationStatusLabel = (status: CourseInvitation["status"]) => {
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
        return "Невідомий статус";
    }
  };

  if (isLoading) {
    return (
      <section className="content-section">
        <div className="participants-loading">Завантаження учасників...</div>
      </section>
    );
  }

  return (
    <>
      <section className="content-section">
        <div className="section-header">
          <div>
            <h2>Учасники курсу</h2>

            <p>
              Студенти
              {isPrivate ? " та запрошення до курсу" : " цього курсу"}
            </p>
          </div>

          {isPrivate && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsInviteModalOpen(true)}
            >
              + Запросити учасника
            </button>
          )}
        </div>

        {error && <div className="form-error participants-error">{error}</div>}

        <div className="participants-block">
          <div className="participants-subheader">
            <h3>Студенти</h3>

            <span>{enrollments.length}</span>
          </div>

          {enrollments.length === 0 ? (
            <div className="participants-empty">
              На курсі поки немає студентів.
            </div>
          ) : (
            <div className="participants-list">
              {enrollments.map((enrollment) => (
                <div className="participant-item" key={enrollment.id}>
                  <div className="participant-info">
                    <div className="participant-avatar">
                      {enrollment.firstName.charAt(0).toUpperCase()}
                      {enrollment.lastName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h4>
                        {enrollment.firstName} {enrollment.lastName}
                      </h4>

                      <p>{enrollment.email}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="participant-icon-button participant-icon-button-danger"
                    onClick={() => setEnrollmentToRemove(enrollment)}
                    disabled={removingUserId === enrollment.userId}
                    title="Видалити з курсу"
                    aria-label="Видалити з курсу"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {isPrivate && (
          <div className="participants-block">
            <div className="participants-subheader">
              <h3>Запрошення</h3>

              <span>{invitations.length}</span>
            </div>

            {invitations.length === 0 ? (
              <div className="participants-empty">Запрошень поки немає.</div>
            ) : (
              <div className="participants-list">
                {invitations.map((invitation) => (
                  <div className="participant-item" key={invitation.id}>
                    <div className="participant-info">
                      <div className="participant-invitation-avatar">
                        {invitation.email.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h4>
                          {invitation.invitedUserName || invitation.email}
                        </h4>

                        {invitation.invitedUserName && (
                          <p>{invitation.email}</p>
                        )}

                        <div className="invitation-meta">
                          <span
                            className={`invitation-status invitation-status-${invitation.status}`}
                          >
                            {getInvitationStatusLabel(invitation.status)}
                          </span>

                          {invitation.status ===
                            CourseInvitationStatus.Pending && (
                            <span>
                              до{" "}
                              {new Date(
                                invitation.expiresAt,
                              ).toLocaleDateString("uk-UA")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {invitation.status === CourseInvitationStatus.Pending && (
                      <button
                        type="button"
                        className="participant-icon-button"
                        onClick={() => setInvitationToCancel(invitation)}
                        disabled={cancellingInvitationId === invitation.id}
                        title="Скасувати запрошення"
                        aria-label="Скасувати запрошення"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <ConfirmDeleteModal
        isOpen={!!enrollmentToRemove}
        title={
          enrollmentToRemove
            ? `${enrollmentToRemove.firstName} ${enrollmentToRemove.lastName}`
            : ""
        }
        isDeleting={removingUserId !== null}
        onCancel={() => setEnrollmentToRemove(null)}
        onConfirm={handleRemoveEnrollment}
      />

      <ConfirmDeleteModal
        isOpen={!!invitationToCancel}
        title={invitationToCancel?.email ?? ""}
        isDeleting={cancellingInvitationId !== null}
        onCancel={() => setInvitationToCancel(null)}
        onConfirm={handleCancelInvitation}
      />
      <InviteCourseMemberModal
        isOpen={isInviteModalOpen}
        courseId={courseId}
        onClose={() => setIsInviteModalOpen(false)}
        onCreated={(invitation) => {
          setInvitations((current) => [invitation, ...current]);
        }}
      />
    </>
  );
}

export default CourseParticipantsSection;
