// types/From.ts
export interface Question {
  qid: string;
  type: 'cloze' | 'categorize' | 'comprehension' | string;
  title: string;
  config: {
    options?: string[];
    textWithBlanks?: string;
    categories?: Array<{ id: string; label: string }>;
    items?: Array<{ id: string; label: string }>;
    passage?: string;
    subQuestions?: Array<{
      id: string;
      question: string;
      options?: string[];
    }>;
    imageUrl?: string;
  };
}

export  interface Form {
  _id?: string;
  owner?: string;
  title: string;
  headerImageUrl?: string;
  description?: string;
  questions: Question[];
}




// types/From.ts
export interface CategorizeAnswer {
  items: Array<{ id: string; belongsTo: string }>;
}

export interface ComprehensionAnswer {
  answers: Array<{ id: string; answer: string }>;
}

export type AnswerValue = 
  | string[] // For cloze questions
  | CategorizeAnswer // For categorize questions
  | ComprehensionAnswer // For comprehension questions
  | string; // For simple text inputs