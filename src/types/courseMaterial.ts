export const CourseMaterialType = {
  Text: 1,
  File: 2,
  Link: 3,
} as const

export type CourseMaterialType =
  (typeof CourseMaterialType)[keyof typeof CourseMaterialType]

export interface CourseMaterial {
  id: number
  courseId: number
  title: string
  type: CourseMaterialType
  textContent: string | null
  url: string | null
  fileUrl: string | null
  originalFileName: string | null
  contentType: string | null
  fileSize: number | null
  order: number
  createdAt: string
}

export interface CreateCourseMaterialRequest {
  title: string
  type: CourseMaterialType
  textContent?: string
  url?: string
  file?: File
}

export interface UpdateCourseMaterialRequest {
  title: string
  textContent?: string
  url?: string
  file?: File
}
