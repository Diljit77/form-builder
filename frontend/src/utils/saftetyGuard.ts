// utils/typeGuards.ts
import type { AnswerValue, CategorizeAnswer, ComprehensionAnswer } from "../types/From";

export const isStringArray = (answer: AnswerValue): answer is string[] => {
  return Array.isArray(answer) && answer.every(item => typeof item === 'string');
};

export const isCategorizeAnswer = (answer: AnswerValue): answer is CategorizeAnswer => {
  return typeof answer === 'object' && 'items' in answer;
};

export const isComprehensionAnswer = (answer: AnswerValue): answer is ComprehensionAnswer => {
  return typeof answer === 'object' && 'answers' in answer;
};