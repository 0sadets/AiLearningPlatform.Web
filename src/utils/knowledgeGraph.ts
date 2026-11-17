import axios from "axios";

import {
  KnowledgeRelationEvidenceRole,
  KnowledgeRelationType,
} from "../types/knowledgeGraph";

export const RELATION_INFO: Record<
  KnowledgeRelationType,
  {
    label: string;
    description: string;
    color: string;
  }
> = {
  [KnowledgeRelationType.RelatedTo]: {
    label: "Пов'язано з",
    description:
      "Між поняттями існує змістовий зв'язок без визначеного напрямку.",
    color: "#64748b",
  },

  [KnowledgeRelationType.PrerequisiteFor]: {
    label: "Передумова для",
    description:
      "Знання вихідного поняття є передумовою для розуміння цільового.",
    color: "#4f46e5",
  },

  [KnowledgeRelationType.PartOf]: {
    label: "Частина",
    description:
      "Вихідне поняття є складовою частиною цільового.",
    color: "#0891b2",
  },

  [KnowledgeRelationType.IsA]: {
    label: "Є різновидом",
    description:
      "Вихідне поняття є конкретним різновидом цільового.",
    color: "#059669",
  },
};

export const EVIDENCE_ROLE_LABELS: Record<
  KnowledgeRelationEvidenceRole,
  string
> = {
  [KnowledgeRelationEvidenceRole.Direct]:
    "Пряме підтвердження",

  [KnowledgeRelationEvidenceRole.SourceContext]:
    "Контекст вихідного поняття",

  [KnowledgeRelationEvidenceRole.TargetContext]:
    "Контекст цільового поняття",
};

export function getKnowledgeGraphError(
  error: unknown,
  fallback = "Сталася помилка. Спробуйте ще раз.",
): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      const response = data as {
        message?: unknown;
        detail?: unknown;
        title?: unknown;
      };

      for (const value of [
        response.message,
        response.detail,
        response.title,
      ]) {
        if (typeof value === "string" && value.trim()) {
          return value;
        }
      }
    }
  }

  return fallback;
}