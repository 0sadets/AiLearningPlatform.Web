import axiosInstance from "./axiosInstance";

import type {
  QuestionConceptSuggestionsResultDto,
  UpdateQuestionConceptsResultDto,
} from "../types/questionKnowledgeConcepts";

export async function suggestQuestionKnowledgeConcepts(
  testId: number,
): Promise<QuestionConceptSuggestionsResultDto> {
  const { data } =
    await axiosInstance.post<QuestionConceptSuggestionsResultDto>(
      `/api/tests/${testId}/knowledge-concepts/suggest`,
    );

  return data;
}

export async function updateQuestionKnowledgeConcepts(
  questionId: number,
  knowledgeConceptIds: number[],
): Promise<UpdateQuestionConceptsResultDto> {
  const { data } =
    await axiosInstance.put<UpdateQuestionConceptsResultDto>(
      `/api/questions/${questionId}/knowledge-concepts`,
      { knowledgeConceptIds },
    );

  return data;
}