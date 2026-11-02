import axiosInstance from "./axiosInstance";
import type { StudentAttemptResultDto } from "../types/studentAttemptResult";
import type {
  TeacherTestResultsDto,
  TeacherAttemptDetailsDto,
} from "../types/testResult";

// Загальна статистика тесту та результати студентів
export async function getTeacherTestResults(
  testId: number,
): Promise<TeacherTestResultsDto> {
  const { data } =
    await axiosInstance.get<TeacherTestResultsDto>(
      `/api/tests/${testId}/results`,
    );

  return data;
}

// Детальний перегляд завершеної спроби студента
export async function getTeacherAttemptDetails(
  attemptId: number,
): Promise<TeacherAttemptDetailsDto> {
  const { data } =
    await axiosInstance.get<TeacherAttemptDetailsDto>(
      `/api/attempts/${attemptId}/details`,
    );

  return data;
}

export async function getStudentAttemptResult(
  attemptId: number,
): Promise<StudentAttemptResultDto> {
  const { data } = await axiosInstance.get<StudentAttemptResultDto>(
    `/api/attempts/${attemptId}/result`,
  );

  return data;
}