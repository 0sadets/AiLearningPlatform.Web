import type { QuestionDraft } from "./testDraft";
import type { TestSettingsValues } from "./testForm";

export interface StoredConstructorDraft {
  settings: TestSettingsValues;
  questions: QuestionDraft[];
  creationMethod: string;
  importedJobIds: string[];
}

export function getConstructorDraftKey(
  courseId: number,
  testId?: number,
): string {
  return testId
    ? `ilearn:test-constructor:${courseId}:test:${testId}`
    : `ilearn:test-constructor:${courseId}:new`;
}

export function readConstructorDraft(
  key: string,
): StoredConstructorDraft | null {
  try {
    const value = sessionStorage.getItem(key);
    if (!value) return null;

    const parsed: unknown = JSON.parse(value);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    const draft = parsed as Partial<StoredConstructorDraft>;

    if (
      !draft.settings ||
      !Array.isArray(draft.questions) ||
      !Array.isArray(draft.importedJobIds)
    ) {
      return null;
    }

    return {
      settings: draft.settings,
      questions: draft.questions,
      creationMethod: draft.creationMethod ?? "manual",
      importedJobIds: draft.importedJobIds,
    };
  } catch {
    return null;
  }
}

export function saveConstructorDraft(
  key: string,
  draft: StoredConstructorDraft,
): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Помилка локального сховища не повинна блокувати редактор.
  }
}

export function removeConstructorDraft(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ігноруємо помилку очищення.
  }
}