import axiosInstance from "./axiosInstance";

import type {
  StudentKnowledgeAnalyticsDto,
  TeacherKnowledgeAnalyticsDto,
} from "../types/knowledgeAnalytics";

export async function getMyCourseAnalytics(
  courseId: number,
): Promise<StudentKnowledgeAnalyticsDto> {
  const { data } =
    await axiosInstance.get<StudentKnowledgeAnalyticsDto>(
      `/api/courses/${courseId}/analytics/me`,
    );

  return data;
}

export async function getStudentCourseAnalytics(
  courseId: number,
  studentId: number,
): Promise<StudentKnowledgeAnalyticsDto> {
  const { data } =
    await axiosInstance.get<StudentKnowledgeAnalyticsDto>(
      `/api/courses/${courseId}/analytics/students/${studentId}`,
    );

  return data;
}

export async function getCourseAnalyticsOverview(
  courseId: number,
): Promise<TeacherKnowledgeAnalyticsDto> {
  const { data } =
    await axiosInstance.get<TeacherKnowledgeAnalyticsDto>(
      `/api/courses/${courseId}/analytics/overview`,
    );

  return data;
}
