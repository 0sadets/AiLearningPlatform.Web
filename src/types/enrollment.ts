export const EnrollmentSource ={
  AddedByTeacher:1,
  Invitation:2,
  SelfEnrolled: 3,
} as const

export type EnrollmentSource = 
(typeof EnrollmentSource)[keyof typeof EnrollmentSource]


export interface Enrollment {
  id: number
  courseId: number
  userId: number

  firstName: string
  lastName: string
  email: string

  enrolledAt: string

  source: EnrollmentSource
}