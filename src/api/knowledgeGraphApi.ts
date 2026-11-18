import api from "./axiosInstance";

import type {
  CourseKnowledgeGraphDto,
  CourseKnowledgeTopicsDto,
  KnowledgeGraphSourceStatusDto,
  GenerateKnowledgeGraphDto,
  KnowledgeGraphGenerationResultDto,
  KnowledgeRelationEnrichmentResultDto,
  KnowledgeTopicGenerationResultDto,
  KnowledgeTopicDto,
  CreateKnowledgeConceptDto,
  UpdateKnowledgeConceptDto,
  CreateKnowledgeRelationDto,
  UpdateKnowledgeRelationDto,
  CreateKnowledgeTopicDto,
  UpdateKnowledgeTopicDto,
} from "../types/knowledgeGraph";

const graphUrl = (courseId: number) =>
  `/api/courses/${courseId}/knowledge-graph`;

// ---------- ГРАФ ----------

export async function getKnowledgeGraph(courseId: number) {
  const response = await api.get<CourseKnowledgeGraphDto>(
    graphUrl(courseId),
  );

  return response.data;
}

export async function getKnowledgeGraphSourceStatus(
  courseId: number,
) {
  const response = await api.get<KnowledgeGraphSourceStatusDto>(
    `${graphUrl(courseId)}/source-status`,
  );

  return response.data;
}

export async function generateKnowledgeGraph(
  courseId: number,
  dto: GenerateKnowledgeGraphDto,
) {
  const response =
    await api.post<KnowledgeGraphGenerationResultDto>(
      `${graphUrl(courseId)}/generate`,
      dto,
    );

  return response.data;
}

export async function deleteKnowledgeGraph(courseId: number) {
  await api.delete(graphUrl(courseId));
}

// ---------- ПОНЯТТЯ ----------

export async function createKnowledgeConcept(
  courseId: number,
  dto: CreateKnowledgeConceptDto,
) {
  const response = await api.post<{ id: number }>(
    `${graphUrl(courseId)}/concepts`,
    dto,
  );

  return response.data;
}

export async function updateKnowledgeConcept(
  courseId: number,
  conceptId: number,
  dto: UpdateKnowledgeConceptDto,
) {
  await api.put(
    `${graphUrl(courseId)}/concepts/${conceptId}`,
    dto,
  );
}

export async function deleteKnowledgeConcept(
  courseId: number,
  conceptId: number,
) {
  await api.delete(
    `${graphUrl(courseId)}/concepts/${conceptId}`,
  );
}

// ---------- СЕМАНТИЧНІ ЗВ'ЯЗКИ ----------

export async function createKnowledgeRelation(
  courseId: number,
  dto: CreateKnowledgeRelationDto,
) {
  const response = await api.post<{ id: number }>(
    `${graphUrl(courseId)}/relations`,
    dto,
  );

  return response.data;
}

export async function updateKnowledgeRelation(
  courseId: number,
  relationId: number,
  dto: UpdateKnowledgeRelationDto,
) {
  await api.put(
    `${graphUrl(courseId)}/relations/${relationId}`,
    dto,
  );
}

export async function deleteKnowledgeRelation(
  courseId: number,
  relationId: number,
) {
  await api.delete(
    `${graphUrl(courseId)}/relations/${relationId}`,
  );
}

export async function enrichKnowledgeRelations(
  courseId: number,
) {
  const response =
    await api.post<KnowledgeRelationEnrichmentResultDto>(
      `${graphUrl(courseId)}/relations/enrich`,
    );

  return response.data;
}

// ---------- НАВЧАЛЬНІ ТЕМИ ----------

export async function getKnowledgeTopics(courseId: number) {
  const response = await api.get<CourseKnowledgeTopicsDto>(
    `${graphUrl(courseId)}/topics`,
  );

  return response.data;
}

export async function generateKnowledgeTopics(
  courseId: number,
  overwriteManualChanges = false,
) {
  const response =
    await api.post<KnowledgeTopicGenerationResultDto>(
      `${graphUrl(courseId)}/topics/generate`,
      undefined,
      {
        params: { overwriteManualChanges },
      },
    );

  return response.data;
}

export async function createKnowledgeTopic(
  courseId: number,
  dto: CreateKnowledgeTopicDto,
) {
  const response = await api.post<KnowledgeTopicDto>(
    `${graphUrl(courseId)}/topics`,
    dto,
  );

  return response.data;
}

export async function updateKnowledgeTopic(
  courseId: number,
  topicId: number,
  dto: UpdateKnowledgeTopicDto,
) {
  const response = await api.put<KnowledgeTopicDto>(
    `${graphUrl(courseId)}/topics/${topicId}`,
    dto,
  );

  return response.data;
}

export async function deleteKnowledgeTopic(
  courseId: number,
  topicId: number,
  transferToTopicId?: number,
) {
  await api.delete(
    `${graphUrl(courseId)}/topics/${topicId}`,
    {
      params: {
        transferToTopicId,
      },
    },
  );
}