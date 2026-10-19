export type AttemptAnswers = Record<number, number[]>;

function storageKey(attemptId: number): string {
  return `ilearn:test-attempt:${attemptId}`;
}

export function loadAttemptAnswers(
  attemptId: number,
): AttemptAnswers {
  try {
    const raw = sessionStorage.getItem(storageKey(attemptId));

    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const result: AttemptAnswers = {};

    for (const [key, value] of Object.entries(parsed)) {
      const questionId = Number(key);

      if (
        Number.isSafeInteger(questionId) &&
        questionId > 0 &&
        Array.isArray(value) &&
        value.every(
          (id) => Number.isSafeInteger(id) && id > 0,
        )
      ) {
        result[questionId] = value;
      }
    }

    return result;
  } catch {
    return {};
  }
}

export function saveAttemptAnswers(
  attemptId: number,
  answers: AttemptAnswers,
): void {
  try {
    sessionStorage.setItem(
      storageKey(attemptId),
      JSON.stringify(answers),
    );
  } catch {
    // Якщо сховище недоступне, відповіді залишаються в React state.
  }
}

export function clearAttemptAnswers(attemptId: number): void {
  try {
    sessionStorage.removeItem(storageKey(attemptId));
  } catch {
    // Не блокуємо завершення тесту через помилку сховища.
  }
}