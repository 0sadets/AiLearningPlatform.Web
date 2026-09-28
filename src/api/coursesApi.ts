import api from './axiosInstance'
import type {
  Course,
  CreateCourseRequest,
  UpdateCourseRequest,
} from '../types/course'

export const getMyCourses = async (): Promise<Course[]> => {
  const response = await api.get<Course[]>(
    '/api/courses/my',
  )

  return response.data
}

export const getCourseById = async (
  id: number,
): Promise<Course> => {
  const response = await api.get<Course>(
    `/api/courses/${id}`,
  )

  return response.data
}

export const createCourse = async (
  data: CreateCourseRequest,
): Promise<Course> => {
  const response = await api.post<Course>(
    '/api/courses',
    data,
  )

  return response.data
}

export const updateCourse = async (
  id: number,
  data: UpdateCourseRequest,
): Promise<Course> => {
  const response = await api.put<Course>(
    `/api/courses/${id}`,
    data,
  )

  return response.data
}

export const archiveCourse = async (
  id: number,
): Promise<void> => {
  await api.post(`/api/courses/${id}/archive`)
}

export const restoreCourse = async (
  id: number,
): Promise<void> => {
  await api.post(`/api/courses/${id}/restore`)
}

export const deleteCourse = async (
  id: number,
): Promise<void> => {
  await api.delete(`/api/courses/${id}`)
}