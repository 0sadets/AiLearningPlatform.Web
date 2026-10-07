import { useState } from "react";
import { AxiosError } from "axios";
import { X } from "lucide-react";
import { useToast } from "../context/ToastContext";

import { createCourseInvitation } from "../api/invitationsApi";

import type { CourseInvitation } from "../types/courseInvitation";

interface InviteCourseMemberModalProps {
  isOpen: boolean;
  courseId: number;
  onClose: () => void;
  onCreated: (invitation: CourseInvitation) => void;
}

function InviteCourseMemberModal({
  isOpen,
  courseId,
  onClose,
  onCreated,
}: InviteCourseMemberModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Вкажіть email користувача.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const invitation = await createCourseInvitation(courseId, {
        email: normalizedEmail,
      });

      onCreated(invitation);
      showToast("Запрошення успішно створено.", "success");
      setEmail("");
      onClose();
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;

        if (typeof message === "string") {
          setError(message);
          return;
        }
      }

      setError("Не вдалося створити запрошення.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setEmail("");
    setError("");
    onClose();
  };

  return (
    <div className="invite-modal-backdrop">
      <div className="invite-modal">
        <div className="invite-modal-header">
          <div>
            <h2>Запросити учасника</h2>

            <p>Вкажіть email користувача, якого хочете запросити до курсу.</p>
          </div>

          <button
            type="button"
            className="invite-modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Закрити"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="invitation-email">Email</label>

            <input
              id="invitation-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);

                if (error) {
                  setError("");
                }
              }}
              placeholder="student@example.com"
              autoFocus
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="invite-modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Скасувати
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Надсилання..." : "Запросити"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteCourseMemberModal;
