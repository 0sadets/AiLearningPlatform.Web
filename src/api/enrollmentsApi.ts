import api from './axiosInstance'

import type { Course } from '../types/course'
import type { Enrollment } from '../types/enrollment'

export const getCourseEnrollments = async (
  courseId: number,
): Promise<Enrollment[]> => {
  const response = await api.get<Enrollment[]>(
    `/api/courses/${courseId}/enrollments`,
  )

  return response.data
}

export const removeCourseEnrollment = async (
  courseId: number,
  userId: number,
): Promise<void> => {
  await api.delete(
    `/api/courses/${courseId}/enrollments/${userId}`,
  )
}


export const getMyEnrolledCourses = async (): Promise<Course[]> => {
  const response = await api.get<Course[]>(
    '/api/enrollments/my-courses',
  )

  return response.data
}

export const joinPublicCourse = async (
  courseId: number,
): Promise<void> => {
  await api.post(
    `/api/courses/${courseId}/join`,
  )
}

export const leavePublicCourse = async (
  courseId: number,
): Promise<void> => {
  await api.post(
    `/api/courses/${courseId}/leave`,
  )
}