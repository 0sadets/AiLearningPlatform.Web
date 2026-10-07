import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Mail } from "lucide-react";
import { useParams } from "react-router-dom";

import { getInvitationByToken } from "../api/invitationsApi";

import {
  CourseInvitationStatus,
  type InvitationDetails,
} from "../types/courseInvitation";

import "../styles/invitation.css";

function InvitationPage() {
  const { token } = useParams();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError("Некоректне посилання на запрошення.");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getInvitationByToken(token);

        setInvitation(data);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          setError("Запрошення не знайдено або посилання недійсне.");
        } else {
          setError("Не вдалося завантажити запрошення.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  const getStatusLabel = () => {
    if (!invitation) {
      return "";
    }

    switch (invitation.status) {
      case CourseInvitationStatus.Pending:
        return "Очікує відповіді";

      case CourseInvitationStatus.Accepted:
        return "Запрошення прийнято";

      case CourseInvitationStatus.Declined:
        return "Запрошення відхилено";

      case CourseInvitationStatus.Expired:
        return "Термін дії запрошення минув";

      case CourseInvitationStatus.Cancelled:
        return "Запрошення скасовано";

      default:
        return "Невідомий статус";
    }
  };

  if (isLoading) {
    return (
      <div className="invitation-page">
        <p>Завантаження запрошення...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="invitation-page">
        <div className="invitation-page-card">
          <Mail size={36} />

          <h1>Запрошення недоступне</h1>

          <p>{error || "Не вдалося знайти це запрошення."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-page">
      <div className="invitation-page-card">
        <div className="invitation-page-icon">
          <Mail size={28} />
        </div>

        <span
          className={`invitation-page-status invitation-page-status-${invitation.status}`}
        >
          {getStatusLabel()}
        </span>

        <h1>Вас запросили на курс</h1>

        <h2>{invitation.courseTitle}</h2>

        <p className="invitation-page-description">
          {invitation.courseDescription || "Опис курсу відсутній."}
        </p>

        <div className="invitation-page-meta">
          <div>
            <span>Запрошує</span>

            <strong>{invitation.invitedByUserName}</strong>
          </div>

          <div>
            <span>Діє до</span>

            <strong>
              {new Date(invitation.expiresAt).toLocaleDateString("uk-UA")}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvitationPage;
