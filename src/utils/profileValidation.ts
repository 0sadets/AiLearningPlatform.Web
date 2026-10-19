
const nameRegex = /^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u;
const phoneRegex = /^\+380\d{9}$/;

export const validateName = (
  value: string,
  fieldName: string,
): string | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return `Поле "${fieldName}" є обов'язковим.`;
  }

  if (trimmed.length < 2 || trimmed.length > 100) {
    return `${fieldName} має містити від 2 до 100 символів.`;
  }

  if (!nameRegex.test(trimmed)) {
    return `${fieldName} може містити лише літери, пробіли, дефіс та апостроф.`;
  }

  return null;
};

export const validatePhone = (
  value: string,
): string | null => {
  if (!value.trim()) {
    return null;
  }

  if (!phoneRegex.test(value.trim())) {
    return "Введіть номер у форматі +380XXXXXXXXX.";
  }

  return null;
};

export const validateDateOfBirth = (
  value: string,
): string | null => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "Введіть коректну дату народження.";
  }

  if (date > today) {
    return "Дата народження не може бути в майбутньому.";
  }

  return null;
};

export const validateAvatar = (
  file: File,
): string | null => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return "Дозволені формати: JPG, PNG, WebP.";
  }

  if (file.size > maxSize) {
    return "Розмір фото не повинен перевищувати 5 МБ.";
  }

  return null;
};
