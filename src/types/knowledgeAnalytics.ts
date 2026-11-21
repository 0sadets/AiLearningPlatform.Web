export type AnalyticsDataStatus =
  | "NoData"
  | "Limited"
  | "Sufficient";

export type ConceptReviewPriority =
  | "NotAssessed"
  | "InsufficientData"
  | "Low"
  | "Medium"
  | "High";

export type RecommendationPriority =
  | "Preliminary"
  | "Low"
  | "Medium"
  | "High";

export interface AnalyticsMaterialDto {
  materialId: number;
  materialTitle: string;
  chunkIndex: number;
  excerpt: string;
}

export interface StudentAnalyticsSummaryDto {
  totalConcepts: number;
  assessedConcepts: number;
  sufficientlyAssessedConcepts: number;
  conceptsNeedingReview: number;
  preliminaryConceptsNeedingReview: number;
  completedTests: number;
  completedAttempts: number;
  excludedLatestAttempts: number;
}

export interface StudentConceptAnalyticsDto {
  conceptId: number;
  name: string;
  description: string | null;

  observedMasteryPercent: number | null;

  questionsCount: number;
  answeredQuestionsCount: number;
  correctAnswersCount: number;
  testsCount: number;

  dataStatus: AnalyticsDataStatus;

  prerequisiteRiskPercent: number | null;
  weakPrerequisiteConceptIds: number[];

  reviewPriority: ConceptReviewPriority;
  materials: AnalyticsMaterialDto[];
}

export interface StudentTopicAnalyticsDto {
  topicId: number;
  name: string;

  totalConcepts: number;
  assessedConcepts: number;
  sufficientlyAssessedConcepts: number;

  observedMasteryPercent: number | null;
  dataStatus: AnalyticsDataStatus;
  conceptIds: number[];
}

export interface StudentRecommendationDto {
  conceptId: number;
  conceptName: string;
  priority: RecommendationPriority;
  reason: string;
  observedMasteryPercent: number | null;
  materials: AnalyticsMaterialDto[];
}

export interface StudentAttemptHistoryDto {
  attemptId: number;
  testId: number;
  testTitle: string;
  completedAtUtc: string;
  percentage: number | null;
  hasKnowledgeSnapshot: boolean;
}

export interface StudentCourseTestProgressDto {
  totalAvailableTests: number;
  completedAvailableTests: number;
  notCompletedAvailableTests: number;
  completionPercent: number | null;
}

export interface StudentKnowledgeAnalyticsDto {
  courseId: number;
  graphRevision: number;
  calculatedAtUtc: string;
  hasCurrentTopics: boolean;
  testProgress?: StudentCourseTestProgressDto | null;

  summary: StudentAnalyticsSummaryDto;
  concepts: StudentConceptAnalyticsDto[];
  topics: StudentTopicAnalyticsDto[];
  recommendations: StudentRecommendationDto[];
  attemptHistory: StudentAttemptHistoryDto[];
  warnings: string[];
}


export interface TeacherAnalyticsSummaryDto {
  enrolledStudents: number;
  studentsWithCompletedTests: number;
  completedAttempts: number;
  latestCompletedAttempts: number;
  excludedLatestAttempts: number;
  averageTestPercent: number | null;
  assessedConcepts: number;
  groupDifficultyCases: number;
  individualDifficultyCases: number;
  questionsForReview: number;
}

export interface TeacherConceptAnalyticsDto {
  conceptId: number;
  name: string;
  averageMasteryPercent: number | null;
  studentsAssessed: number;
  questionsCount: number;
  dataStatus: AnalyticsDataStatus;
  hasGroupDifficulty: boolean;
}

export interface TeacherTopicAnalyticsDto {
  topicId: number;
  name: string;
  totalConcepts: number;
  assessedConcepts: number;
  averageMasteryPercent: number | null;
  dataStatus: AnalyticsDataStatus;
  conceptIds: number[];
}

export interface TeacherStudentAnalyticsDto {
  userId: number;
  firstName: string;
  lastName: string;
  completedTests: number;
  averageTestPercent: number | null;
  assessedConcepts: number;
  individualDifficultyCases: number;
}

export interface TeacherQuestionWrongOptionDto {
  optionId: number;
  text: string;
  selectedCount: number;
}

export interface TeacherQuestionAnalyticsDto {
  questionId: number;
  testId: number;
  text: string;
  participantsCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  errorPercent: number | null;
  historicalConceptIds: number[];
  currentConceptIds: number[];
  wrongOptions: TeacherQuestionWrongOptionDto[];
  needsReview: boolean;
  errorContrastPercent: number | null;
}

export type TeacherFindingKind =
  | "IndividualDifficulty"
  | "GroupDifficulty"
  | "QuestionReview";

export type AnalyticsEvidenceLevel =
  | "Preliminary"
  | "Comparative";

export interface TeacherAnalyticsFindingDto {
  kind: TeacherFindingKind;
  title: string;
  explanation: string;
  recommendedAction: string;
  conceptId: number | null;
  questionId: number | null;
  userId: number | null;
  evidenceLevel: AnalyticsEvidenceLevel;
}

export interface TeacherKnowledgeAnalyticsDto {
  courseId: number;
  graphRevision: number;
  calculatedAtUtc: string;
  hasCurrentTopics: boolean;

  summary: TeacherAnalyticsSummaryDto;
  concepts: TeacherConceptAnalyticsDto[];
  topics: TeacherTopicAnalyticsDto[];
  students: TeacherStudentAnalyticsDto[];
  questions: TeacherQuestionAnalyticsDto[];
  findings: TeacherAnalyticsFindingDto[];
  warnings: string[];
}