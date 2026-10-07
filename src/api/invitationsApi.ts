import api from './axiosInstance'

import type {
  CourseInvitation,
  CreateCourseInvitationRequest,
  InvitationDetails,
} from '../types/courseInvitation'

export const acceptInvitation = async (
  invitationId: number,
): Promise<void> => {
  await api.post(
    `/api/invitations/${invitationId}/accept`,
  )
}

export const getInvitationByToken = async (
  token: string,
): Promise<InvitationDetails> => {
  const response = await api.get<InvitationDetails>(
    `/api/invitations/by-token/${token}`,
  )

  return response.data
}

export const declineInvitation = async (
  invitationId: number,
): Promise<void> => {
  await api.post(
    `/api/invitations/${invitationId}/decline`,
  )
}
export const getCourseInvitations = async (
  courseId: number,
): Promise<CourseInvitation[]> => {
  const response = await api.get<CourseInvitation[]>(
    `/api/courses/${courseId}/invitations`,
  )

  return response.data
}
export const getMyInvitations = async (): Promise<CourseInvitation[]> => {
  const response = await api.get<CourseInvitation[]>(
    '/api/invitations/my',
  )

  return response.data
}
export const createCourseInvitation = async (
  courseId: number,
  data: CreateCourseInvitationRequest,
): Promise<CourseInvitation> => {
  const response = await api.post<CourseInvitation>(
    `/api/courses/${courseId}/invitations`,
    data,
  )

  return response.data
}

export const cancelCourseInvitation = async (
  courseId: number,
  invitationId: number,
): Promise<void> => {
  await api.delete(
    `/api/courses/${courseId}/invitations/${invitationId}`,
  )
}

