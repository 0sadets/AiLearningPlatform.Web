import axiosInstance from "./axiosInstance";
import type {
  CreateQuestionDto,
  QuestionDto,
  ReorderQuestionsDto,
  UpdateQuestionDto,
} from "../types/testQuestion";

export async function getTestQuestions(testId: number): Promise<QuestionDto[]> {
  const { data } = await axiosInstance.get<QuestionDto[]>(
    `/api/tests/${testId}/questions`,
  );
  return data;
}

export async function getQuestionById(questionId: number): Promise<QuestionDto> {
  const { data } = await axiosInstance.get<QuestionDto>(
    `/api/questions/${questionId}`,
  );
  return data;
}

export async function createTestQuestion(
  testId: number,
  payload: CreateQuestionDto,
): Promise<QuestionDto> {
  const { data } = await axiosInstance.post<QuestionDto>(
    `/api/tests/${testId}/questions`,
    payload,
  );
  return data;
}

export async function updateTestQuestion(
  questionId: number,
  payload: UpdateQuestionDto,
): Promise<QuestionDto> {
  const { data } = await axiosInstance.put<QuestionDto>(
    `/api/questions/${questionId}`,
    payload,
  );
  return data;
}

export async function deleteTestQuestion(questionId: number): Promise<void> {
  await axiosInstance.delete(`/api/questions/${questionId}`);
}

export async function reorderTestQuestions(
  testId: number,
  questionIds: ReorderQuestionsDto["questionIds"],
): Promise<void> {
  await axiosInstance.put(`/api/tests/${testId}/questions/reorder`, {
    questionIds,
  } satisfies ReorderQuestionsDto);
}
