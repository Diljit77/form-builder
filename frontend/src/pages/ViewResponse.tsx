import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";

// Define your types
interface Category {
  id: string;
  label: string;
}

interface Item {
  id: string;
  label: string;
  belongsTo?: string;
}

interface SubQuestion {
  id: string;
  question: string;
  options?: string[];
}

interface QuestionConfig {
  categories?: Category[];
  items?: Item[];
  options?: string[];
  textWithBlanks?: string;
  passage?: string;
  subQuestions?: SubQuestion[];
  imageUrl?: string;
}

interface Question {
  qid: string;
  type: 'cloze' | 'categorize' | 'comprehension' | string;
  title: string;
  config: QuestionConfig;
}

interface AnswerItem {
  id: string;
  belongsTo: string;
}

interface AnswerSubQuestion {
  id: string;
  answer: string;
}

type AnswerValue = 
  | string[] 
  | { items: AnswerItem[] }
  | { answers: AnswerSubQuestion[] }
  | string;

interface Responder {
  _id: string;
  name: string;
  email?: string;
}

interface APIResponse {
  _id: string;
  form: {
    _id: string;
    title: string;
    description?: string;
    headerImageUrl?: string;
    questions?: Question[];
  };
  responder?: Responder;
  submittedAt: string;
  answers: {
    question: Question;
    answer: AnswerValue;
  }[];
}

// Enhanced type guards
const isStringArray = (answer: AnswerValue): answer is string[] => {
  return Array.isArray(answer) && answer.every(item => typeof item === 'string');
};

const isAnswerItems = (answer: AnswerValue): answer is { items: AnswerItem[] } => {
  return answer !== null && typeof answer === 'object' && 'items' in answer && Array.isArray((answer as any).items);
};

const isAnswerSubQuestions = (answer: AnswerValue): answer is { answers: AnswerSubQuestion[] } => {
  return answer !== null && typeof answer === 'object' && 'answers' in answer && Array.isArray((answer as any).answers);
};

const isString = (answer: AnswerValue): answer is string => {
  return typeof answer === 'string';
};

const getAnswerAsString = (answer: AnswerValue): string => {
  if (isString(answer)) return answer;
  if (isStringArray(answer)) return answer.join(', ');
  return "Not answered";
};

export default function ViewResponse() {
  const { id } = useParams<{ id: string }>();
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submittedDate, setSubmittedDate] = useState("");

  useEffect(() => {
    API.get<APIResponse>(`forms/responses/${id}`)
      .then((res) => {
        setResponse(res.data);
        
        if (res.data.submittedAt) {
          const date = new Date(res.data.submittedAt);
          setSubmittedDate(date.toLocaleString());
        }

        const ansMap: Record<string, AnswerValue> = {};
        res.data.answers.forEach((a) => {
          ansMap[a.question.qid] = a.answer;
        });
        setAnswers(ansMap);
      })
      .catch(() => alert("Response not found"));
  }, [id]);

  if (!response) {
    return <div className="text-center py-8">Loading response...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header Section */}
      <div className="mb-4">
        {response.form.headerImageUrl && (
          <div className="mb-4">
            <img 
              src={response.form.headerImageUrl} 
              alt="Form header" 
              className="w-full h-auto rounded-lg object-cover max-h-64"
            />
          </div>
        )}
        <h1 className="text-2xl font-bold mb-2">{response.form.title}</h1>
        {response.form.description && (
          <p className="text-gray-600 mb-6">{response.form.description}</p>
        )}
      </div>

      {/* Responder Info */}
      <div className="mb-6">
        <label className="block mb-1 font-medium">Responder</label>
        <div className="space-y-2">
          <input
            className="input input-bordered w-full"
            value={response.responder?.name || "Anonymous"}
            readOnly
          />
          {response.responder?.email && (
            <input
              className="input input-bordered w-full"
              value={response.responder.email}
              readOnly
            />
          )}
        </div>
        <div className="mt-2">
          <label className="block mb-1 font-medium">Submitted At</label>
          <input
            className="input input-bordered w-full"
            value={submittedDate}
            readOnly
          />
        </div>
      </div>

      {/* Questions & Answers */}
      <div className="space-y-6">
        {response.answers.map(({ question: q }) => {
          const answer = answers[q.qid] ?? "";
          
          return (
            <div key={q.qid} className="card bg-base-100 shadow">
              <div className="card-body">
                {/* Question Header */}
                <div className="mb-2">
                  <h2 className="card-title">{q.title}</h2>
                  {q.config.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={q.config.imageUrl} 
                        alt="Question" 
                        className="w-full h-auto rounded-lg object-cover max-h-48"
                      />
                    </div>
                  )}
                </div>

                {/* Cloze Question */}
                {q.type === "cloze" && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {q.config.options?.map((opt, i) => (
                        <div
                          key={i}
                          className={`badge p-3 ${
                            isStringArray(answer) && answer.includes(opt)
                              ? 'badge-secondary' 
                              : 'badge-outline opacity-50'
                          }`}
                        >
                          {opt}
                          {isStringArray(answer) && answer.includes(opt) && (
                            <span className="ml-1">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {q.config.textWithBlanks && (
                      <div className="whitespace-pre-wrap">
                        {q.config.textWithBlanks.split('_____').map((part, i) => (
                          <span key={i}>
                            {part}
                            {i < q.config.textWithBlanks!.split('_____').length - 1 && (
                              <span className="inline-flex items-center min-w-[100px] border-2 rounded p-1 mx-1 border-primary bg-primary bg-opacity-10">
                                {isStringArray(answer) && answer[i] 
                                  ? answer[i] 
                                  : <span className="text-gray-400 italic">empty</span>}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Categorize Question */}
                {q.type === "categorize" && (
                  <div className="space-y-4">
                    <div className="mt-6">
                      <h3 className="font-bold text-lg mb-2">Items Categorized</h3>
                      <div className="flex flex-wrap gap-3 p-4 bg-base-200 rounded-lg">
                        {q.config.items?.filter(item => 
                          isAnswerItems(answer) &&
                          !answer.items.find(i => i.id === item.id && i.belongsTo)
                        ).map(item => (
                          <div
                            key={item.id}
                            className="badge badge-outline p-3 opacity-50"
                          >
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg">Categories</h3>
                    <div className="flex flex-wrap gap-4">
                      {q.config.categories?.map(cat => {
                        const categoryItems = q.config.items?.filter(item => 
                          isAnswerItems(answer) &&
                          answer.items.find(i => i.id === item.id && i.belongsTo === cat.id)
                        );
                        return (
                          <div
                            key={cat.id}
                            className="flex-1 min-w-[150px] max-w-[200px] border-2 border-primary rounded-lg p-3 bg-base-200 h-[150px] overflow-y-auto"
                          >
                            <div className="font-medium text-center mb-2 sticky top-0 bg-base-200 pb-2">
                              {cat.label}
                            </div>
                            <div className="flex flex-col gap-2">
                              {categoryItems?.map(item => (
                                <div
                                  key={item.id}
                                  className="badge badge-primary p-3 flex justify-between items-center"
                                >
                                  {item.label}
                                  <span className="ml-1">✓</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Comprehension Question */}
                {q.type === "comprehension" && (
                  <div className="space-y-6">
                    <div className="p-4 bg-base-200 rounded-lg">
                      <p className="whitespace-pre-line">{q.config.passage}</p>
                    </div>
                    
                    <div className="space-y-6">
                      {q.config.subQuestions?.map((sq, i) => (
                        <div key={i} className="space-y-3">
                          <p className="font-medium text-lg">{sq.question}</p>
                          <div className="space-y-2">
                            {sq.options?.map((opt, j) => (
                              <label key={j} className="flex items-center gap-3 p-3 rounded-lg">
                                <input
                                  type="radio"
                                  name={`comprehension-${q.qid}-${i}`}
                                  className="radio radio-primary"
                                  checked={
                                    isAnswerSubQuestions(answer) && 
                                    answer.answers[i]?.answer === opt
                                  }
                                  readOnly
                                />
                                <span className={
                                  isAnswerSubQuestions(answer) && 
                                  answer.answers[i]?.answer === opt
                                    ? "font-bold text-primary"
                                    : ""
                                }>
                                  {opt}
                                  {isAnswerSubQuestions(answer) && 
                                  answer.answers[i]?.answer === opt && (
                                    <span className="ml-1">✓</span>
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Default text input for other types */}
                {!["cloze", "categorize", "comprehension"].includes(q.type) && (
                  <input
                    type="text"
                    className="input input-bordered w-full mt-2 bg-gray-100"
                    value={getAnswerAsString(answer)}
                    readOnly
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}