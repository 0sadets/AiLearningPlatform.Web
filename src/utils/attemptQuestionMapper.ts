import type {
  AttemptQuestionView,
} from "../types/attemptQuestionView";

import type {
  StudentResultQuestionDto,
} from "../types/studentAttemptResult";

import type {
  TeacherQuestionResultDto,
} from "../types/testResult";

export function mapStudentQuestionToView(
  question: StudentResultQuestionDto,
): AttemptQuestionView {
  return {
    questionId: question.questionId,
    text: question.text,
    type: question.type,
    order: question.order,
    points: question.points,

    isAnswered: question.isAnswered,
    isCorrect: question.isCorrect,

    textAnswer: question.textAnswer,
    earnedPoints: null,

    answerOptions: question.answerOptions,

    isAiGenerated: question.isAiGenerated,
    sourceMaterialId: question.sourceMaterialId,
    sourceMaterialTitle: question.sourceMaterialTitle,
    sourceChunkIndex: question.sourceChunkIndex,
    sourceExcerpt: question.sourceExcerpt,
  };
}

export function mapTeacherQuestionToView(
  question: TeacherQuestionResultDto,
): AttemptQuestionView {
  return {
    questionId: question.questionId,
    text: question.text,
    type: question.type,
    order: question.order,
    points: question.points,

    isAnswered: question.wasAnswered,
    isCorrect: question.isCorrect,

    textAnswer: null,
    earnedPoints: question.earnedPoints,

    answerOptions: question.answerOptions,

    isAiGenerated: false,
    sourceMaterialId: null,
    sourceMaterialTitle: null,
    sourceChunkIndex: null,
    sourceExcerpt: null,
  };
}