export const KnowledgeRelationType = {
  RelatedTo: 1,
  PrerequisiteFor: 2,
  PartOf: 3,
  IsA: 4,
} as const;

export type KnowledgeRelationType =
  (typeof KnowledgeRelationType)[keyof typeof KnowledgeRelationType];

export const KnowledgeRelationEvidenceRole = {
  Direct: 1,
  SourceContext: 2,
  TargetContext: 3,
} as const;

export type KnowledgeRelationEvidenceRole =
  (typeof KnowledgeRelationEvidenceRole)[keyof typeof KnowledgeRelationEvidenceRole];

export interface KnowledgeGraphConceptEvidenceDto {
  id: number;
  materialId: number;
  materialTitle: string;
  chunkIndex: number;
  excerpt: string;
}

export interface KnowledgeGraphConceptDto {
  id: number;
  name: string;
  normalizedName: string;
  description: string | null;
  isManuallyEdited: boolean;
  evidences: KnowledgeGraphConceptEvidenceDto[];
}


export interface KnowledgeGraphRelationEvidenceDto {
  id: number;
  materialId: number;
  materialTitle: string;
  chunkIndex: number;
  excerpt: string;
  role: KnowledgeRelationEvidenceRole;
}

export interface KnowledgeGraphRelationDto {
  id: number;
  sourceConceptId: number;
  targetConceptId: number;
  type: KnowledgeRelationType;
  isManuallyEdited: boolean;
  evidences: KnowledgeGraphRelationEvidenceDto[];
}


export interface CourseKnowledgeGraphDto {
  id: number;
  courseId: number;
  revision: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  concepts: KnowledgeGraphConceptDto[];
  relations: KnowledgeGraphRelationDto[];
}


export interface KnowledgeGraphSourceStatusDto {
  graphId: number;
  courseId: number;
  isSourceCurrent: boolean;
  sourceMaterialIds: number[];
  missingMaterialIds: number[];
}


export interface GenerateKnowledgeGraphDto {
  materialIds: number[];
}

export interface KnowledgeGraphGenerationResultDto {
  graphId: number;
  conceptsCount: number;
  relationsCount: number;
  evidencesCount: number;
  processedChunksCount: number;
  generationMode: "Compact" | "Detailed";
}


export interface KnowledgeRelationEnrichmentResultDto {
  graphId: number;
  courseId: number;
  graphRevision: number;
  relationsBefore: number;
  relationsAdded: number;
  relationsAfter: number;
  isolatedConceptsBefore: number;
  isolatedConceptsAfter: number;
}


export interface KnowledgeTopicDto {
  id: number;
  name: string;
  description: string | null;
  order: number;
  conceptIds: number[];
  isManuallyEdited: boolean;
}

export interface CourseKnowledgeTopicsDto {
  graphId: number;
  courseId: number;
  graphRevision: number;
  hasGeneratedTopics: boolean;
  isCurrent: boolean;
  topicsCount: number;
  coveredConceptsCount: number;
  topics: KnowledgeTopicDto[];
}

export interface KnowledgeTopicGenerationResultDto {
  graphId: number;
  courseId: number;
  graphRevision: number;
  topicsCount: number;
  coveredConceptsCount: number;
  topics: KnowledgeTopicDto[];
}


export interface CreateKnowledgeConceptDto {
  name: string;
  description: string | null;
  topicIds: number[];
}

export interface UpdateKnowledgeConceptDto {
  name: string;
  description: string | null;
}


export interface CreateKnowledgeRelationDto {
  sourceConceptId: number;
  targetConceptId: number;
  type: KnowledgeRelationType;
}

export type UpdateKnowledgeRelationDto =
  CreateKnowledgeRelationDto;


export interface CreateKnowledgeTopicDto {
  name: string;
  description: string | null;
  order: number;
  conceptIds: number[];
}

export type UpdateKnowledgeTopicDto =
  CreateKnowledgeTopicDto;


export type KnowledgeGraphViewMode =
  | "topics"
  | "relations";

export type KnowledgeGraphSelection =
  | { kind: "concept"; id: number }
  | { kind: "relation"; id: number }
  | { kind: "topic"; id: number }
  | null;