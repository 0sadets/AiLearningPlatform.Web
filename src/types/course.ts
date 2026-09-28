export interface Course {
  id: number
  title: string
  description: string
  createdByUserId: number
  createdByUserName: string
  createdAt: string
  isArchived: boolean
}

export interface CreateCourseRequest {
  title: string
  description: string
}

export interface UpdateCourseRequest {
  title: string
  description: string
}