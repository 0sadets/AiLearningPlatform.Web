import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { getCurrentUser, updateProfile } from "../api/authApi";
import { useUser } from "../context/UserContext";
import type { UserProfile } from "../types/auth";
import { useToast } from "../context/ToastContext";

import {
  validateName,
  validatePhone,
  validateDateOfBirth,
  validateAvatar,
} from "../utils/profileValidation";

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const { showToast } = useToast();

  const { setCurrentUser } = useUser();

  const [avatar, setAvatar] = useState<File | undefined>();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  //const [error, setError] = useState('')
  // const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getCurrentUser();

        setProfile(data);

        setFirstName(data.firstName);
        setLastName(data.lastName);
        setPhoneNumber(data.phoneNumber ?? "");
        setDateOfBirth(data.dateOfBirth ?? "");

        setAvatarPreview(data.avatarUrl);
      } catch {
        // setError('Не вдалося завантажити профіль.')
        showToast("Не вдалося завантажити профіль.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);


const handleAvatarChange = (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  const validationError = validateAvatar(file);

  if (validationError) {
    showToast(validationError, "error");
    event.target.value = "";
    return;
  }

  setAvatar(file);
  setRemoveAvatar(false);

  const previewUrl = URL.createObjectURL(file);
  setAvatarPreview(previewUrl);

  event.target.value = "";
};


  const handleRemoveAvatar = () => {
    setAvatar(undefined);
    setAvatarPreview(null);
    setRemoveAvatar(true);
  };


const handleSubmit = async (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  const validationError =
    validateName(firstName, "Ім'я") ??
    validateName(lastName, "Прізвище") ??
    validatePhone(phoneNumber) ??
    validateDateOfBirth(dateOfBirth);

  if (validationError) {
    showToast(validationError, "error");
    return;
  }

  setIsSaving(true);

  try {
    const updatedProfile = await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      dateOfBirth,
      avatar,
      removeAvatar,
    });

    setProfile(updatedProfile);
    setCurrentUser(updatedProfile);

    setFirstName(updatedProfile.firstName);
    setLastName(updatedProfile.lastName);
    setPhoneNumber(updatedProfile.phoneNumber ?? "");
    setDateOfBirth(updatedProfile.dateOfBirth ?? "");

    setAvatarPreview(updatedProfile.avatarUrl);

    setAvatar(undefined);
    setRemoveAvatar(false);

    showToast("Профіль успішно оновлено.", "success");
  } catch (error) {
    if (error instanceof AxiosError) {
      showToast(
        error.response?.data?.message ??
          "Не вдалося оновити профіль.",
        "error",
      );
    } else {
      showToast("Сталася невідома помилка.", "error");
    }
  } finally {
    setIsSaving(false);
  }
};


  if (isLoading) {
    return (
      <div className="page">
        <p>Завантаження профілю...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <div className="form-error">{"Профіль не знайдено."}</div>
      </div>
    );
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

const today = new Date();
const localToday = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");



  return (
    <div className="page profile-page">
      <div className="page-header">
        <div>
          <h1>Мій кабінет</h1>
          <p>Керуйте персональною інформацією вашого акаунта</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Аватар користувача" />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="profile-avatar-actions">
            <label className="secondary-button avatar-upload-button">
              Завантажити фото
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                hidden
              />
            </label>

            {avatarPreview && (
              <button
                type="button"
                className="remove-avatar-button"
                onClick={handleRemoveAvatar}
              >
                Видалити фото
              </button>
            )}
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-form-grid">
            <div className="form-group">
              <label htmlFor="firstName">Ім&apos;я</label>

              <input
                id="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                  minLength={2}
  maxLength={100}
  autoComplete="given-name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Прізвище</label>

              <input
                id="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                  minLength={2}
  maxLength={100}
  autoComplete="family-name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>

              <input id="email" value={profile.email} disabled />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Номер телефону</label>

              
<input
  id="phoneNumber"
  type="tel"
  placeholder="+380671234567"
  value={phoneNumber}
  maxLength={13}
  inputMode="tel"
  autoComplete="tel"
  onChange={(event) => {
    const value = event.target.value;

    if (/^\+?\d*$/.test(value)) {
      setPhoneNumber(value);
    }
  }}
/>

            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Дата народження</label>

             
<input
  id="dateOfBirth"
  type="date"
  value={dateOfBirth}
  max={localToday}
  onChange={(event) =>
    setDateOfBirth(event.target.value)
  }
/>

            </div>

            <div className="form-group">
              <label>Дата реєстрації</label>

              <input
                value={new Date(profile.createdAt).toLocaleDateString("uk-UA")}
                disabled
              />
            </div>
          </div>
          {/* 
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {success && (
            <div className="form-success">
              {success}
            </div>
          )} */}

          <div className="profile-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={isSaving}
            >
              {isSaving ? "Збереження..." : "Зберегти зміни"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
