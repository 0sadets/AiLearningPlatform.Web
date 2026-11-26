import type {
  AnalyticsDataStatus,
  StudentKnowledgeAnalyticsDto,
  TeacherKnowledgeAnalyticsDto,
  StudentConceptAnalyticsDto,
StudentRecommendationDto,
} from "../types/knowledgeAnalytics";

export interface GraphMasteryValue {
  percent: number | null;
  dataStatus: AnalyticsDataStatus;
  studentsAssessed?: number;
  assessedConcepts?: number;
  totalConcepts?: number;
  hasGroupDifficulty?: boolean;
}

export interface GraphMasteryData {
  graphRevision: number;
  hasCurrentTopics: boolean;

  concepts: Map<number, GraphMasteryValue>;
  topics: Map<number, GraphMasteryValue>;

  warnings: string[];
  studentsWithCompletedTests?: number;

  studentConceptDetails?: Map<
    number,
    StudentConceptAnalyticsDto
  >;

  studentRecommendations?: Map<
    number,
    StudentRecommendationDto
  >;
}

export type GraphMasteryTone =
  | "high"
  | "medium"
  | "low"
  | "none";

export function getGraphMasteryTone(
  value: GraphMasteryValue | undefined,
): GraphMasteryTone {
  if (
    !value ||
    value.dataStatus === "NoData" ||
    value.percent === null ||
    !Number.isFinite(value.percent)
  ) {
    return "none";
  }

  if (value.percent >= 80) return "high";
  if (value.percent >= 60) return "medium";

  return "low";
}

export function getGraphTopicMasteryTone(
  value: GraphMasteryValue | undefined,
): GraphMasteryTone {
  if (
    !value ||
    !value.totalConcepts ||
    (value.assessedConcepts ?? 0) / value.totalConcepts < 0.5
  ) {
    return "none";
  }

  return getGraphMasteryTone(value);
}

export function getGraphMasteryLabel(
  value: GraphMasteryValue | undefined,
): string {
  if (getGraphMasteryTone(value) === "none") {
    return "Ще не оцінено";
  }

  const percent = new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 1,
  }).format(value!.percent!);

  return value!.dataStatus === "Limited"
    ? `${percent}% · Попередньо`
    : `${percent}%`;
}

export function mapStudentGraphMastery(
  data: StudentKnowledgeAnalyticsDto,
): GraphMasteryData {
  return {

    studentConceptDetails: new Map(
  data.concepts.map((concept) => [
    concept.conceptId,
    concept,
  ]),
),

studentRecommendations: new Map(
  data.recommendations.map((recommendation) => [
    recommendation.conceptId,
    recommendation,
  ]),
),
    graphRevision: data.graphRevision,
    hasCurrentTopics: data.hasCurrentTopics,
    warnings: data.warnings,

    concepts: new Map(
      data.concepts.map((concept) => [
        concept.conceptId,
        {
          percent: concept.observedMasteryPercent,
          dataStatus: concept.dataStatus,
        },
      ]),
    ),

    topics: new Map(
      data.hasCurrentTopics
        ? data.topics.map((topic) => [
            topic.topicId,
            {
              percent: topic.observedMasteryPercent,
              dataStatus: topic.dataStatus,
              assessedConcepts: topic.assessedConcepts,
              totalConcepts: topic.totalConcepts,
            },
          ] as const)
        : [],
    ),
  };
}

export function mapTeacherGraphMastery(
  data: TeacherKnowledgeAnalyticsDto,
): GraphMasteryData {
  return {
    graphRevision: data.graphRevision,
    hasCurrentTopics: data.hasCurrentTopics,
    warnings: data.warnings,
    studentsWithCompletedTests:
      data.summary.studentsWithCompletedTests,

    concepts: new Map(
      data.concepts.map((concept) => [
        concept.conceptId,
        {
          percent: concept.averageMasteryPercent,
          dataStatus: concept.dataStatus,
          studentsAssessed: concept.studentsAssessed,
          hasGroupDifficulty: concept.hasGroupDifficulty,
        },
      ]),
    ),

    topics: new Map(
      data.hasCurrentTopics
        ? data.topics.map((topic) => [
            topic.topicId,
            {
              percent: topic.averageMasteryPercent,
              dataStatus: topic.dataStatus,
              assessedConcepts: topic.assessedConcepts,
              totalConcepts: topic.totalConcepts,
            },
          ] as const)
        : [],
    ),
  };
}