
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  CheckCircle2,
  LogIn,
  Mail,
  XCircle,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api/axiosInstance";

import {
  acceptInvitation,
  declineInvitation,
  getInvitationByToken,
} from "../api/invitationsApi";

import {
  CourseInvitationStatus,
  type InvitationDetails,
} from "../types/courseInvitation";

import { useToast } from "../context/ToastContext";

import "../styles/invitation.css";

type CurrentUser = {
  id: number;
  email: string;
};

function InvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [invitation, setInvitation] =
    useState<InvitationDetails | null>(null);

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const isAuthenticated = currentUser !== null;

  const isPending =
    invitation?.status === CourseInvitationStatus.Pending;

  const isAccepted =
    invitation?.status === CourseInvitationStatus.Accepted;

  // Перевіряємо актуального користувача
  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      setIsAuthLoading(true);

      if (!localStorage.getItem("token")) {
        setCurrentUser(null);
        setIsAuthLoading(false);
        return;
      }

      try {
        const response = await api.get<CurrentUser>(
          "/api/auth/me"
        );

        if (!cancelled) {
          setCurrentUser(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          setCurrentUser(null);

          if (
            error instanceof AxiosError &&
            error.response?.status === 401
          ) {
            localStorage.removeItem("token");
          }
        }
      } finally {
        if (!cancelled) {
          setIsAuthLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // Завантажуємо запрошення
  useEffect(() => {
    let cancelled = false;

    const loadInvitation = async () => {
      setIsLoading(true);
      setError("");
      setInvitation(null);

      if (!token) {
        setError("Некоректне посилання на запрошення.");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getInvitationByToken(token);

        if (!cancelled) {
          setInvitation(data);
        }
      } catch (error) {
        if (cancelled) return;

        if (
          error instanceof AxiosError &&
          error.response?.status === 404
        ) {
          setError(
            "Запрошення не знайдено або посилання недійсне."
          );
        } else {
          setError("Не вдалося завантажити запрошення.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadInvitation();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleLogin = () => {
    if (!token) return;

    const returnUrl = `/invitations/${token}`;

    navigate(
      `/login?returnUrl=${encodeURIComponent(returnUrl)}`
    );
  };

  const handleAccept = async () => {
    if (!invitation || isProcessing || !isPending) return;

    if (!isAuthenticated) {
      handleLogin();
      return;
    }

    setIsProcessing(true);

    try {
      await acceptInvitation(invitation.id);

      setInvitation((current) =>
        current
          ? {
              ...current,
              status: CourseInvitationStatus.Accepted,
            }
          : current
      );

      showToast(
        "Запрошення прийнято! Курс додано до ваших курсів.",
        "success"
      );
    } catch (error) {
      handleActionError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation || isProcessing || !isPending) return;

    if (!isAuthenticated) {
      handleLogin();
      return;
    }

    setIsProcessing(true);

    try {
      await declineInvitation(invitation.id);

      setInvitation((current) =>
        current
          ? {
              ...current,
              status: CourseInvitationStatus.Declined,
            }
          : current
      );

      showToast("Запрошення відхилено.", "success");
    } catch (error) {
      handleActionError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionError = (error: unknown) => {
    if (error instanceof AxiosError) {
      const status = error.response?.status;

      if (status === 401) {
        localStorage.removeItem("token");
        setCurrentUser(null);

        showToast(
          "Сесія завершилася. Увійдіть повторно.",
          "error"
        );

        handleLogin();
        return;
      }

      if (status === 403) {
        showToast(
          "Це запрошення призначене для іншого акаунта.",
          "error"
        );
        return;
      }

      const message = error.response?.data?.message;

      if (typeof message === "string") {
        showToast(message, "error");
        return;
      }
    }

    showToast(
      "Не вдалося обробити запрошення.",
      "error"
    );
  };

  const getStatusLabel = () => {
    if (!invitation) return "";

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

  if (isLoading || isAuthLoading) {
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

          <p>
            {error || "Не вдалося знайти це запрошення."}
          </p>

          <Link to="/courses" className="secondary-button">
            Переглянути курси
          </Link>
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
          {invitation.courseDescription ||
            "Опис курсу відсутній."}
        </p>

        <div className="invitation-page-meta">
          <div>
            <span>Запрошує</span>
            <strong>
              {invitation.invitedByUserName}
            </strong>
          </div>

          <div>
            <span>Діє до</span>
            <strong>
              {new Date(
                invitation.expiresAt
              ).toLocaleDateString("uk-UA")}
            </strong>
          </div>
        </div>

        {isPending && (
          <>
            {!isAuthenticated && (
              <div className="invitation-auth-notice">
                <LogIn size={20} />

                <p>
                  Щоб прийняти або відхилити запрошення,
                  увійдіть до свого акаунта iLearn.
                </p>
              </div>
            )}

            <div className="invitation-page-actions">
              {isAuthenticated && (
              <button
                type="button"
                className="secondary-button"
                onClick={handleDecline}
                disabled={isProcessing}
              >
                <XCircle size={18} />
                Відхилити
              </button>
            )}

              <button
                type="button"
                className="primary-button"
                onClick={handleAccept}
                disabled={isProcessing}
              >
                {!isAuthenticated ? (
                  <>
                    <LogIn size={18} />
                    Увійти та прийняти
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    {isProcessing
                      ? "Обробка..."
                      : "Прийняти запрошення"}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {isAccepted && (
          <div className="invitation-result">
            <CheckCircle2 size={24} />

            <p>
              Запрошення прийнято!
              Тепер курс доступний у ваших курсах.
            </p>

            <Link
              to="/my-courses?tab=enrolled"
              className="primary-button"
            >
              Перейти до моїх курсів
            </Link>
          </div>
        )}

        {invitation.status ===
          CourseInvitationStatus.Declined && (
          <div className="invitation-result invitation-result-declined">
            <p>Ви відхилили це запрошення.</p>
          </div>
        )}

        <Link
          to="/courses"
          className="invitation-page-back"
        >
          Переглянути всі курси
        </Link>

      </div>
    </div>
  );
}

export default InvitationPage;
