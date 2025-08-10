import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import type { Form } from "../types/From";

interface Question {
  qid: string;
  type: string;
  title: string;
  config: any;
}

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
  };
  responder?: Responder;
  submittedAt: string;
  answers: {
    question: Question;
    answer: any;
  }[];
}

export default function ViewResponse() {
  const { id } = useParams(); // id = responseId from URL
  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [responder, setResponder] = useState<Responder | null>(null);

  useEffect(() => {
    API.get<APIResponse>(`forms/responses/${id}`)
      .then((res) => {
        const apiData = res.data;

        // Build questions array from answers[].question
        const questions = apiData.answers.map((a) => a.question);

        // Merge into form object so form.questions is defined
        setForm({
          ...apiData.form,
          questions,
        } as Form);

        // Set responder data if available
        if (apiData.responder) {
          setResponder(apiData.responder);
        }

        // Map qid → answer value
        const ansMap: Record<string, any> = {};
        apiData.answers.forEach((a) => {
          ansMap[a.question.qid] = a.answer;
        });
        setAnswers(ansMap);
      })
      .catch(() => alert("Response not found"));
  }, [id]);

  if (!form) {
    return <div className="text-center py-8">Loading response...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
      {form.description && (
        <p className="text-gray-600 mb-6">{form.description}</p>
      )}

      {responder && (
        <div className="mb-6">
          <label className="block mb-1 font-medium">Responder</label>
          <div className="space-y-2">
            <input
              className="input input-bordered w-full"
              value={responder.name}
              readOnly
            />
            {responder.email && (
              <input
                className="input input-bordered w-full"
                value={responder.email}
                readOnly
              />
            )}
          </div>
        </div>
      )}

      {/* Rest of your component remains the same */}
      <div className="space-y-6">
        {form.questions.map((q) => (
          <div key={q.qid} className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">{q.title}</h2>

              {/* Cloze Question - Show filled blanks */}
              {q.type === "cloze" && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {q.config.options?.map((opt, i) => (
                      <div
                        key={i}
                        className={`badge p-3 ${
                          answers[q.qid]?.includes(opt) 
                            ? 'badge-secondary' 
                            : 'badge-outline opacity-50'
                        }`}
                      >
                        {opt}
                        {answers[q.qid]?.includes(opt) && (
                          <span className="ml-1">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="whitespace-pre-wrap">
                    {q.config.textWithBlanks?.split('_____').map((part, i) => (
                      <span key={i}>
                        {part}
                        {i < q.config.textWithBlanks.split('_____').length - 1 && (
                          <span className="inline-flex items-center min-w-[100px] border-2 rounded p-1 mx-1 border-primary bg-primary bg-opacity-10">
                            {answers[q.qid]?.[i] || (
                              <span className="text-gray-400 italic">empty</span>
                            )}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorize Question - Show items with their categories */}
              {q.type === "categorize" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Categories:</h3>
                    <div className="flex flex-wrap gap-2">
                      {q.config.categories?.map(cat => (
                        <div
                          key={cat.id}
                          className="badge badge-primary p-3"
                        >
                          {cat.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Items:</h3>
                    <div className="flex flex-wrap gap-2">
                      {q.config.items?.map(item => {
                        const category = q.config.categories?.find(
                          c => c.id === answers[q.qid]?.items?.find(
                            (i: any) => i.id === item.id
                          )?.belongsTo
                        );
                        return (
                          <div
                            key={item.id}
                            className={`badge p-3 ${
                              category ? 'badge-secondary' : 'badge-outline opacity-50'
                            }`}
                          >
                            {item.label}
                            {category && (
                              <span className="ml-2">→ {category.label}</span>
                            )}
                            {!category && (
                              <span className="ml-2 text-xs opacity-70">(uncategorized)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Comprehension Question - Show passage and answers */}
              {q.type === "comprehension" && (
                <div className="space-y-4">
                  <div className="p-3 rounded bg-base-200">
                    {q.config.passage}
                  </div>
                  
                  <div className="space-y-4">
                    {q.config.subQuestions?.map((sq, i) => (
                      <div key={i} className="space-y-2">
                        <p className="font-medium">{sq.question}</p>
                        <div className="p-2 border rounded bg-base-200">
                          {sq.options ? (
                            <select
                              className="select select-bordered w-full bg-gray-100"
                              value={answers[q.qid]?.answers?.[i]?.answer || ""}
                              disabled
                            >
                              <option value="">{answers[q.qid]?.answers?.[i]?.answer || "Not answered"}</option>
                              {sq.options.map((opt, j) => (
                                <option key={j} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              className="input input-bordered w-full bg-gray-100"
                              value={answers[q.qid]?.answers?.[i]?.answer || "Not answered"}
                              readOnly
                            />
                          )}
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
                  value={answers[q.qid] || "Not answered"}
                  readOnly
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}