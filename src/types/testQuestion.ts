/** Types match the backend TestQuestionController DTOs. */
export const QuestionType = {
  SingleChoice: 1,
  MultipleChoice: 2,
  TrueFalse: 3,
  Text: 4,
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export interface CreateAnswerOptionDto {
  text: string;
  isCorrect: boolean;
}

export interface CreateQuestionDto {
  text: string;
  type: QuestionType;
  points: number;
  answerOptions: CreateAnswerOptionDto[];
}

export type UpdateQuestionDto = CreateQuestionDto;

export interface AnswerOptionDto {
  id: number;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface QuestionDto {
  id: number;
  testId: number;
  text: string;
  type: QuestionType;
  points: number;
  order: number;
  answerOptions: AnswerOptionDto[];
}

export interface ReorderQuestionsDto {
  questionIds: number[];
}
