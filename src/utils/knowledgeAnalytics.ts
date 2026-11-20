import type {
  AnalyticsDataStatus,
  ConceptReviewPriority,
  RecommendationPriority,
} from "../types/knowledgeAnalytics";

const percentFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 1,
});

export function formatAnalyticsPercent(
  value: number | null,
): string {
  if (value === null || !Number.isFinite(value)) {
    return "Не оцінено";
  }

  return `${percentFormatter.format(value)}%`;
}

export function getAnalyticsDataStatusLabel(
  status: AnalyticsDataStatus,
): string {
  switch (status) {
    case "NoData":
      return "Ще не оцінено";
    case "Limited":
      return "Попередній результат";
    case "Sufficient":
      return "Достатньо даних";
  }
}

export function getReviewPriorityLabel(
  priority: ConceptReviewPriority,
): string {
  switch (priority) {
    case "NotAssessed":
      return "Не оцінено";
    case "InsufficientData":
      return "Замало даних";
    case "Low":
      return "Низький";
    case "Medium":
      return "Середній";
    case "High":
      return "Високий";
  }
}

export function getRecommendationPriorityLabel(
  priority: RecommendationPriority,
): string {
  switch (priority) {
    case "Preliminary":
      return "Попередня рекомендація";
    case "Low":
      return "Низький пріоритет";
    case "Medium":
      return "Середній пріоритет";
    case "High":
      return "Високий пріоритет";
  }
}

export function getAnalyticsScoreColor(
  value: number | null,
): string {
  if (value === null) {
    return "#94a3b8";
  }

  if (value >= 80) {
    return "#16a34a";
  }

  if (value >= 60) {
    return "#d97706";
  }

  return "#dc2626";
}

export function formatAnalyticsDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Дата недоступна";
  }

  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}