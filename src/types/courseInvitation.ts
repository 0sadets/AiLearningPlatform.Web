
export const CourseInvitationStatus = {
  Pending: 1,
  Accepted: 2,
  Declined: 3,
  Expired: 4,
  Cancelled: 5,
}as const

export type CourseInvitationStatus =
(typeof CourseInvitationStatus)[keyof typeof CourseInvitationStatus]

export interface CourseInvitation {
  id: number

  courseId: number
  courseTitle: string

  email: string

  invitedUserId: number | null
  invitedUserName: string | null

  invitedByUserId: number
  invitedByUserName: string

  status: CourseInvitationStatus

  createdAt: string
  expiresAt: string
  respondedAt: string | null
}

export interface CreateCourseInvitationRequest {
  email: string
}

export interface InvitationDetails {
  id: number
  courseTitle: string
  courseDescription: string | null
  invitedByUserName: string
  status: CourseInvitationStatus
  expiresAt: string
  isExpired: boolean
}