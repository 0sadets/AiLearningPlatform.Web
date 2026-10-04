export const CourseVisibility = {
  Private: 1,
  Public: 2,
} as const

export type CourseVisibility =
  (typeof CourseVisibility)[keyof typeof CourseVisibility]

export interface Course {
  id: number
  title: string
  description: string | null
  createdByUserId: number
  createdByUserName: string
  createdAt: string
  isArchived: boolean
  visibility: CourseVisibility
}

export interface CourseDetails extends Course {
  imageUrl: string | null
  studentsCount: number
  materialsCount: number
  testsCount: number
}

export interface CreateCourseRequest {
  title: string
  description?: string
  visibility: CourseVisibility
}

export interface UpdateCourseRequest {
  title: string
  description?: string
  visibility: CourseVisibility
}

export interface CourseImageResponse {
  imageUrl: string
}