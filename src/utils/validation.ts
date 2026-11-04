export function validateRequired(
  value: string,
  fieldName: string,
): string | undefined {
  if (!value.trim()) {
    return `${fieldName} — обов'язкове поле.`;
  }

  return undefined;
}

export function validateMaxLength(
  value: string,
  maxLength: number,
): string | undefined {
  if (value.trim().length > maxLength) {
    return `Максимальна довжина — ${maxLength} символів.`;
  }

  return undefined;
}

export function validateEmail(
  value: string,
): string | undefined {
  if (!value.trim()) {
    return "Електронна пошта обов'язкова.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return "Вкажіть коректну електронну адресу.";
  }

  return undefined;
}

export function validateHttpsUrl(
  value: string,
): string | undefined {
  if (!value.trim()) {
    return "Посилання обов'язкове.";
  }

  try {
    const parsed = new URL(value.trim());

    if (parsed.protocol !== "https:" || !parsed.hostname) {
      return "Посилання має починатися з https://.";
    }
  } catch {
    return "Вкажіть коректне посилання.";
  }

  return undefined;
}

interface FileValidationOptions {
  required?: boolean;
  maxSizeBytes?: number;
  allowedExtensions?: string[];
}

export function validateFile(
  file: File | undefined,
  options: FileValidationOptions = {},
): string | undefined {
  const {
    required = false,
    maxSizeBytes,
    allowedExtensions,
  } = options;

  if (!file) {
    return required ? "Оберіть файл." : undefined;
  }

  if (file.size === 0) {
    return "Файл порожній. Оберіть інший файл.";
  }

  if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
    const maxSizeMb = maxSizeBytes / (1024 * 1024);

    return `Максимальний розмір файлу — ${maxSizeMb} МБ.`;
  }

  if (allowedExtensions?.length) {
    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return `Дозволені формати: ${allowedExtensions.join(", ")}.`;
    }
  }

  return undefined;
}