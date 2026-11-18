export interface QuestionConceptSuggestionDto {
  questionId: number;
  conceptIds: number[];
}

export interface QuestionConceptSuggestionsResultDto {
  testId: number;
  suggestions: QuestionConceptSuggestionDto[];
}

export interface UpdateQuestionConceptsResultDto {
  questionId: number;
  knowledgeConceptIds: number[];
}

export interface AiConceptSuggestionDraft {
  recommendedConceptIds: number[];
  selectedConceptIds: number[];
  approved: boolean;
}