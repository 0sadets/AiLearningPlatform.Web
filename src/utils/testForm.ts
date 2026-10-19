import { AxiosError } from "axios";
import type { CreateTestDto, TestDto } from "../types/test";

export interface TestSettingsValues {
  title: string;
  description: string;
  attemptsLimited: boolean;
  maxAttempts: string;
  deadlineEnabled: boolean;
  deadlineLocal: string;
}

/** datetime-local expects local clock time, not an ISO UTC timestamp. */
export function formatLocalDateTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getInitialTestSettings(test?: TestDto): TestSettingsValues {
  return {
    title: test?.title ?? "",
    description: test?.description ?? "",
    attemptsLimited: test?.maxAttempts != null,
    maxAttempts: String(test?.maxAttempts ?? 3),
    deadlineEnabled: test?.deadline != null,
    deadlineLocal: formatLocalDateTime(test?.deadline ?? null),
  };
}

export function validateTestSettings(value: TestSettingsValues): string | null {
  const title = value.title.trim();
  if (title.length < 3 || title.length > 200) {
    return "Назва тесту повинна містити від 3 до 200 символів.";
  }
  if (value.description.trim().length > 2000) {
    return "Опис тесту не може перевищувати 2000 символів.";
  }
  if (value.attemptsLimited) {
    const attempts = Number(value.maxAttempts);
    if (!/^\d+$/.test(value.maxAttempts.trim()) || !Number.isSafeInteger(attempts) || attempts < 1) {
      return "Кількість спроб повинна бути цілим додатним числом.";
    }
  }
  if (value.deadlineEnabled) {
    const date = new Date(value.deadlineLocal);
    if (!value.deadlineLocal || Number.isNaN(date.getTime())) {
      return "Вкажіть коректну дату та час дедлайну.";
    }
    if (date.getTime() <= Date.now()) {
      return "Дедлайн повинен бути в майбутньому.";
    }
  }
  return null;
}

export function toTestPayload(value: TestSettingsValues): CreateTestDto {
  return {
    title: value.title.trim(),
    description: value.description.trim() || null,
    maxAttempts: value.attemptsLimited ? Number(value.maxAttempts) : null,
    deadline: value.deadlineEnabled ? new Date(value.deadlineLocal).toISOString() : null,
  };
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 401;
}

export function getTestApiError(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
      return data.message;
    }
    // ASP.NET Core ValidationProblemDetails
    if (data && typeof data === "object" && "errors" in data && data.errors && typeof data.errors === "object") {
      const errors = Object.values(data.errors as Record<string, unknown>);
      const first = errors.find((messages) => Array.isArray(messages) && typeof messages[0] === "string");
      if (Array.isArray(first)) return first[0] as string;
    }
  }
  return fallback;
}
