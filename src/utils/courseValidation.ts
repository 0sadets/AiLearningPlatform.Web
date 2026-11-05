import {
  validateRequired,
  validateMaxLength,
} from "./validation";

export interface CourseFormErrors {
  title?: string;
  description?: string;
  image?: string;
}

export function validateCourseTitle(
  value: string,
): string | undefined {
  return (
    validateRequired(value, "Назва курсу") ||
    validateMaxLength(value, 200)
  );
}

export function validateCourseDescription(
  value: string,
): string | undefined {
  return validateMaxLength(value, 2000);
}

export function validateCourseImage(
  file: File | null,
): string | undefined {
  if (!file) return undefined;

  if (file.size === 0) {
    return "Зображення порожнє. Оберіть інший файл.";
  }

  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  const extension = file.name
    .slice(file.name.lastIndexOf("."))
    .toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return "Дозволені формати: JPG, PNG, WEBP.";
  }

  return undefined;
}

export function validateCourseForm(
  title: string,
  description: string,
  image: File | null = null,
): CourseFormErrors {
  return {
    title: validateCourseTitle(title),
    description: validateCourseDescription(description),
    image: validateCourseImage(image),
  };
}

export function hasCourseFormErrors(
  errors: CourseFormErrors,
): boolean {
  return Object.values(errors).some(Boolean);
}