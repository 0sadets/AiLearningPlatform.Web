import axiosInstance from "./axiosInstance";

import type {
  TestAttemptDto,
  TestAttemptResultDto,
  SubmitTestAttemptDto,
} from "../types/testAttempt";

// Початок або продовження спроби
export async function startTestAttempt(
  testId: number,
): Promise<TestAttemptDto> {
  const { data } = await axiosInstance.post<TestAttemptDto>(
    `/api/tests/${testId}/attempts`,
  );

  return data;
}

// Завантаження активної спроби
export async function getTestAttempt(
  attemptId: number,
): Promise<TestAttemptDto> {
  const { data } = await axiosInstance.get<TestAttemptDto>(
    `/api/attempts/${attemptId}`,
  );

  return data;
}

// Завершення тесту
export async function submitTestAttempt(
  attemptId: number,
  payload: SubmitTestAttemptDto,
): Promise<TestAttemptResultDto> {
  const { data } =
    await axiosInstance.post<TestAttemptResultDto>(
      `/api/attempts/${attemptId}/submit`,
      payload,
    );

  return data;
}

// Історія спроб студента
export async function getMyTestAttempts(
  testId: number,
): Promise<TestAttemptResultDto[]> {
  const { data } = await axiosInstance.get<
    TestAttemptResultDto[]
  >(`/api/tests/${testId}/my-attempts`);

  return data;
}

// Результат завершеної спроби
export async function getTestAttemptResult(
  attemptId: number,
): Promise<TestAttemptResultDto> {
  const { data } =
    await axiosInstance.get<TestAttemptResultDto>(
      `/api/attempts/${attemptId}/result`,
    );

  return data;
}