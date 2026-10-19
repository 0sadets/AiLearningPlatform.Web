import axiosInstance from "./axiosInstance";
import type {
  CreateTestDto,
  FullTestDraftDto,
  TestDto,
  UpdateTestDto,
} from "../types/test";

export async function getCourseTests(courseId: number): Promise<TestDto[]> {
  const { data } = await axiosInstance.get<TestDto[]>(
    `/api/courses/${courseId}/tests`,
  );
  return data;
}

export async function getTestById(testId: number): Promise<TestDto> {
  const { data } = await axiosInstance.get<TestDto>(`/api/tests/${testId}`);
  return data;
}

export async function createTest(
  courseId: number,
  payload: CreateTestDto,
): Promise<TestDto> {
  const { data } = await axiosInstance.post<TestDto>(
    `/api/courses/${courseId}/tests`,
    payload,
  );
  return data;
}

export async function updateTest(
  testId: number,
  payload: UpdateTestDto,
): Promise<TestDto> {
  const { data } = await axiosInstance.put<TestDto>(
    `/api/tests/${testId}`,
    payload,
  );
  return data;
}

export async function deleteTest(testId: number): Promise<void> {
  await axiosInstance.delete(`/api/tests/${testId}`);
}

export async function publishTest(testId: number): Promise<void> {
  await axiosInstance.patch(`/api/tests/${testId}/publish`);
}

export async function archiveTest(testId: number): Promise<void> {
  await axiosInstance.patch(`/api/tests/${testId}/archive`);
}


// Створення тесту разом з усіма питаннями
export async function createFullTest(
  courseId: number,
  payload: FullTestDraftDto,
): Promise<Partial<TestDto> | null> {
  const { data } = await axiosInstance.post<Partial<TestDto> | null>(
    `/api/courses/${courseId}/tests/full`,
    payload,
  );

  return data && typeof data === "object" ? data : null;
}

// Повне збереження чернетки тесту
export async function updateTestDraft(
  testId: number,
  payload: FullTestDraftDto,
): Promise<void> {
  await axiosInstance.put(
    `/api/tests/${testId}/draft`,
    payload,
  );
}