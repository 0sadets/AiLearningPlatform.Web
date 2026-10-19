export function formatTestResultDate(
  value: string | null,
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTestPercentage(
  value: number | null,
): string {
  if (value === null) return "—";

  return `${new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export function formatTestScore(
  score: number | null,
  maxScore: number | null,
): string {
  if (score === null || maxScore === null) {
    return "—";
  }

  return `${score} / ${maxScore}`;
}

export function getStudentInitials(
  firstName: string,
  lastName: string,
): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`
    .toUpperCase() || "?";
}