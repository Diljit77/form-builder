export interface Question {
  qid: string;
  type: "categorize" | "cloze" | "comprehension";
  title: string;
  imageUrl?: string;
  config: any;
}

export  interface Form {
  _id?: string;
  owner?: string;
  title: string;
  headerImageUrl?: string;
  description?: string;
  questions: Question[];
}
