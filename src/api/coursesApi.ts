import api from './axiosInstance'

import type {
  Course,
  CourseDetails,
  CreateCourseRequest,
  UpdateCourseRequest,
  CourseImageResponse,
} from '../types/course'

import type {
  CourseMaterial,
  CreateCourseMaterialRequest,
  UpdateCourseMaterialRequest,
} from '../types/courseMaterial'

export const getMyCourses = async (): Promise<Course[]> => {
  const response = await api.get<Course[]>(
    '/api/courses/my',
  )

  return response.data
}

export const getPublicCourses = async (): Promise<Course[]> => {
  const response = await api.get<Course[]>(
    '/api/courses/all-public',
  )

  return response.data
}

export const getCourseById = async (
  id: number,
): Promise<CourseDetails> => {
  const response = await api.get<CourseDetails>(
    `/api/courses/${id}`,
  )

  return response.data
}

export const getCourseMaterials = async (
  courseId: number,
): Promise<CourseMaterial[]> => {
  const response = await api.get<CourseMaterial[]>(
    `/api/courses/${courseId}/materials`,
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
export const updateCourseImage = async (
  courseId: number,
  file: File,
): Promise<CourseImageResponse> => {
  const formData = new FormData()

  formData.append('file', file)

  const response = await api.put<CourseImageResponse>(
    `/api/courses/${courseId}/image`,
    formData,
  )

  return response.data
}

export const deleteCourseImage = async (
  courseId: number,
): Promise<void> => {
  await api.delete(`/api/courses/${courseId}/image`)
}

export const createCourseMaterial = async (
  courseId: number,
  data: CreateCourseMaterialRequest,
): Promise<CourseMaterial> => {
  const formData = new FormData()

  formData.append('Title', data.title)
  formData.append('Type', data.type.toString())

  if (data.textContent) {
    formData.append('TextContent', data.textContent)
  }

  if (data.url) {
    formData.append('Url', data.url)
  }

  if (data.file) {
    formData.append('File', data.file)
  }

  const response = await api.post<CourseMaterial>(
    `/api/courses/${courseId}/materials`,
    formData,
  )

  return response.data
}

export const updateCourseMaterial = async (
  courseId: number,
  materialId: number,
  data: UpdateCourseMaterialRequest,
): Promise<CourseMaterial> => {
  const formData = new FormData()

  formData.append('Title', data.title)

  if (data.textContent !== undefined) {
    formData.append('TextContent', data.textContent)
  }

  if (data.url !== undefined) {
    formData.append('Url', data.url)
  }

  if (data.file) {
    formData.append('File', data.file)
  }

  const response = await api.put<CourseMaterial>(
    `/api/courses/${courseId}/materials/${materialId}`,
    formData,
  )

  return response.data
}

export const deleteCourseMaterial = async (
  courseId: number,
  materialId: number,
): Promise<void> => {
  await api.delete(
    `/api/courses/${courseId}/materials/${materialId}`,
  )
}