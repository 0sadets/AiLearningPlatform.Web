import api from "./axiosInstance";

import type {
  CreateAiGenerationDto,
  AiGenerationJobDto,
  AiGenerationResultDto,
} from "../types/aiGeneration";

export async function createAiGeneration(
  courseId: number,
  payload: CreateAiGenerationDto,
): Promise<AiGenerationJobDto> {
  const { data } = await api.post<AiGenerationJobDto>(
    `/api/courses/${courseId}/ai/generations`,
    payload,
  );

  return data;
}

export async function getAiGenerationStatus(
  courseId: number,
  jobId: string,
): Promise<AiGenerationJobDto> {
  const { data } = await api.get<AiGenerationJobDto>(
    `/api/courses/${courseId}/ai/generations/${jobId}`,
  );

  return data;
}

export async function getAiGenerationResult(
  courseId: number,
  jobId: string,
): Promise<AiGenerationResultDto | null> {
  const response = await api.get<AiGenerationResultDto>(
    `/api/courses/${courseId}/ai/generations/${jobId}/result`,
  );

  if (response.status === 202) {
    return null;
  }

  return response.data;
}

export async function cancelAiGeneration(
  courseId: number,
  jobId: string,
): Promise<AiGenerationJobDto> {
  const { data } = await api.post<AiGenerationJobDto>(
    `/api/courses/${courseId}/ai/generations/${jobId}/cancel`,
  );

  return data;
}