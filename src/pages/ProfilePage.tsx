import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { getCurrentUser, updateProfile } from "../api/authApi";
import { useUser } from "../context/UserContext";
import type { UserProfile } from "../types/auth";
import { useToast } from "../context/ToastContext";
import FormField from "../components/ui/FormField";
import {
  validateName,
  validatePhone,
  validateDateOfBirth,
  validateAvatar,
} from "../utils/profileValidation";
interface ProfileFormErrors {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  avatar?: string;
}
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
const [errors, setErrors] = useState<ProfileFormErrors>({});
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

useEffect(() => {
  if (!avatar) return;

  const previewUrl = URL.createObjectURL(avatar);

  setAvatarPreview(previewUrl);

  return () => {
    URL.revokeObjectURL(previewUrl);
  };
}, [avatar]);
const handleAvatarChange = (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  const validationError = validateAvatar(file);

  setErrors((current) => ({
    ...current,
    avatar: validationError ?? undefined,
  }));

  if (validationError) {
    event.target.value = "";
    return;
  }

  setAvatar(file);
  setRemoveAvatar(false);

  //setAvatarPreview(URL.createObjectURL(file));

  event.target.value = "";
};


const handleRemoveAvatar = () => {
  setAvatar(undefined);
  setAvatarPreview(null);
  setRemoveAvatar(true);

  setErrors((current) => ({
    ...current,
    avatar: undefined,
  }));
};

const validateProfileForm = (): ProfileFormErrors => {
  return {
    firstName:
      validateName(firstName, "Ім'я") ?? undefined,

    lastName:
      validateName(lastName, "Прізвище") ?? undefined,

    phoneNumber:
      validatePhone(phoneNumber) ?? undefined,

    dateOfBirth:
      validateDateOfBirth(dateOfBirth) ?? undefined,

    avatar:
      avatar ? validateAvatar(avatar) ?? undefined : undefined,
  };
};
const handleSubmit = async (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

if (isSaving) return;

const nextErrors = validateProfileForm();

setErrors(nextErrors);

if (Object.values(nextErrors).some(Boolean)) {
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
            <label
  className={`secondary-button avatar-upload-button ${
    errors.avatar ? "avatar-upload-button--error" : ""
  }`}
>
  Завантажити фото

  <input
    type="file"
    accept=".jpg,.jpeg,.png,.webp"
    onChange={handleAvatarChange}
    disabled={isSaving}
    hidden
  />
</label>

{errors.avatar && (
  <p className="form-field-error" role="alert">
    {errors.avatar}
  </p>
)}

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

        <form className="profile-form" onSubmit={handleSubmit} noValidate>
          <div className="profile-form-grid">
            <FormField
  id="firstName"
  label="Ім'я"
  required
  error={errors.firstName}
>
  <input
    id="firstName"
    value={firstName}
    minLength={2}
    maxLength={100}
    autoComplete="given-name"
    disabled={isSaving}
    aria-invalid={!!errors.firstName}
    aria-describedby={
      errors.firstName ? "firstName-error" : undefined
    }
    onBlur={() => {
      setErrors((current) => ({
        ...current,
        firstName: validateName(firstName, "Ім'я") ?? undefined,
      }));
    }}
    onChange={(event) => {
      const value = event.target.value;
      setFirstName(value);

      if (errors.firstName) {
        setErrors((current) => ({
          ...current,
          firstName: validateName(value, "Ім'я") ?? undefined,
        }));
      }
    }}
  />
</FormField>
           <FormField
  id="lastName"
  label="Прізвище"
  required
  error={errors.lastName}
>
  <input
    id="lastName"
    value={lastName}
    minLength={2}
    maxLength={100}
    autoComplete="family-name"
    disabled={isSaving}
    aria-invalid={!!errors.lastName}
    aria-describedby={
      errors.lastName ? "lastName-error" : undefined
    }
    onBlur={() => {
      setErrors((current) => ({
        ...current,
        lastName:
          validateName(lastName, "Прізвище") ?? undefined,
      }));
    }}
    onChange={(event) => {
      const value = event.target.value;
      setLastName(value);

      if (errors.lastName) {
        setErrors((current) => ({
          ...current,
          lastName:
            validateName(value, "Прізвище") ?? undefined,
        }));
      }
    }}
  />
</FormField>

         <FormField
  id="email"
  label="Email"
  hint="Електронну адресу наразі не можна змінити."
>
  <input
    id="email"
    type="email"
    value={profile.email}
    disabled
    aria-describedby="email-hint"
  />
</FormField>

        <FormField
  id="phoneNumber"
  label="Номер телефону"
  error={errors.phoneNumber}
  hint="Наприклад: +380671234567"
>
  <input
    id="phoneNumber"
    type="tel"
    placeholder="+380671234567"
    value={phoneNumber}
    maxLength={13}
    inputMode="tel"
    autoComplete="tel"
    disabled={isSaving}
    aria-invalid={!!errors.phoneNumber}
    aria-describedby={
      errors.phoneNumber
        ? "phoneNumber-error"
        : "phoneNumber-hint"
    }
    onBlur={() => {
      setErrors((current) => ({
        ...current,
        phoneNumber: validatePhone(phoneNumber) ?? undefined,
      }));
    }}
    onChange={(event) => {
      const value = event.target.value;

      if (/^\+?\d*$/.test(value)) {
        setPhoneNumber(value);

        if (errors.phoneNumber) {
          setErrors((current) => ({
            ...current,
            phoneNumber: validatePhone(value) ?? undefined,
          }));
        }
      }
    }}
  />
</FormField>
           <FormField
  id="dateOfBirth"
  label="Дата народження"
  error={errors.dateOfBirth}
>
  <input
    id="dateOfBirth"
    type="date"
    value={dateOfBirth}
    max={localToday}
    disabled={isSaving}
    aria-invalid={!!errors.dateOfBirth}
    aria-describedby={
      errors.dateOfBirth ? "dateOfBirth-error" : undefined
    }
    onBlur={() => {
      setErrors((current) => ({
        ...current,
        dateOfBirth:
          validateDateOfBirth(dateOfBirth) ?? undefined,
      }));
    }}
    onChange={(event) => {
      const value = event.target.value;
      setDateOfBirth(value);

      if (errors.dateOfBirth) {
        setErrors((current) => ({
          ...current,
          dateOfBirth:
            validateDateOfBirth(value) ?? undefined,
        }));
      }
    }}
  />
</FormField>

           <FormField
  id="createdAt"
  label="Дата реєстрації"
>
  <input
    id="createdAt"
    value={new Date(profile.createdAt).toLocaleDateString("uk-UA")}
    disabled
  />
</FormField>
          </div>


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
