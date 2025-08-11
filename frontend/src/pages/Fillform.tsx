import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import type { Form, Question } from "../types/From";

type CategorizeAnswer = {
  items: Array<{ id: string; belongsTo: string }>;
};

type ComprehensionAnswer = {
  answers: Array<{ id: string; answer: string }>;
};

type ClozeAnswer = string[];

type TextAnswer = string;

type AnswerValue = CategorizeAnswer | ComprehensionAnswer | ClozeAnswer | TextAnswer;

// Helper type guards
function isCategorizeAnswer(answer: AnswerValue): answer is CategorizeAnswer {
  return (answer as CategorizeAnswer).items !== undefined;
}

function isComprehensionAnswer(answer: AnswerValue): answer is ComprehensionAnswer {
  return (answer as ComprehensionAnswer).answers !== undefined;
}

function isClozeAnswer(answer: AnswerValue): answer is ClozeAnswer {
  return Array.isArray(answer);
}

export default function FillForm() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [responder, setResponder] = useState("");
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: string; qid: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get<Form>(`/forms/${id}`)
      .then((res) => {
        setForm(res.data);
        const initialAnswers: Record<string, AnswerValue> = {};
        res.data.questions.forEach((q: Question) => {
          if (q.type === "categorize") {
            initialAnswers[q.qid] = {
              items: q.config.items?.map((item: any) => ({
                id: item.id,
                belongsTo: ""
              })) || []
            };
          } else if (q.type === "comprehension") {
            initialAnswers[q.qid] = {
              answers: q.config.subQuestions?.map((sq: any) => ({
                id: sq.id,
                answer: ""
              })) || []
            };
          } else if (q.type === "cloze") {
            initialAnswers[q.qid] = q.config.textWithBlanks?.split('_____').map(() => "") || [];
          } else {
            initialAnswers[q.qid] = "";
          }
        });
        setAnswers(initialAnswers);
      })
      .catch(() => alert("Form not found"));
  }, [id]);

  const handleDragStart = (e: React.DragEvent, itemId: string, type: string, qid: string) => {
    setDraggedItem({ id: itemId, type, qid });
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
    
    // Add visual feedback
    const element = e.currentTarget as HTMLElement;
    element.classList.add("dragging");
    setTimeout(() => (element.style.opacity = "0.4"), 0);
  };

  const handleDrop = (e: React.DragEvent, targetId: string, type: string, qid: string, blankIndex?: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Reset drag visuals
    document.querySelectorAll<HTMLElement>(".dragging").forEach(el => {
      el.classList.remove("dragging");
      el.style.opacity = "1";
    });

    if (type === "category" && draggedItem.type === "item") {
      handleCategorizeChange(qid, draggedItem.id, targetId);
    } else if (type === "blank" && draggedItem.type === "option") {
      const answer = answers[qid];
      if (isClozeAnswer(answer)) {
        const newAnswers = [...answer];
        newAnswers[blankIndex!] = draggedItem.id;
        handleAnswerChange(qid, newAnswers);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    // Add visual feedback for drop targets
    const target = e.currentTarget as HTMLElement;
    target.classList.add("drop-target");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove("drop-target");
  };

  const handleAnswerChange = (qid: string, value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  const handleCategorizeChange = (qid: string, itemId: string, categoryId: string) => {
    setAnswers(prev => {
      const currentAnswer = prev[qid];
      if (!isCategorizeAnswer(currentAnswer)) return prev;
      
      const updatedItems = currentAnswer.items.map(item => 
        item.id === itemId ? { ...item, belongsTo: categoryId } : item
      );
      return { ...prev, [qid]: { items: updatedItems } };
    });
  };

  const handleComprehensionChange = (qid: string, sqIndex: number, value: string) => {
    setAnswers(prev => {
      const currentAnswer = prev[qid];
      if (!isComprehensionAnswer(currentAnswer)) return prev;
      
      const updatedAnswers = [...currentAnswer.answers];
      updatedAnswers[sqIndex] = { 
        ...updatedAnswers[sqIndex], 
        answer: value 
      };
      return { ...prev, [qid]: { answers: updatedAnswers } };
    });
  };

  const removeItemFromCategory = (qid: string, itemId: string) => {
    handleCategorizeChange(qid, itemId, "");
  };

  const removeClozeAnswer = (qid: string, index: number) => {
    const answer = answers[qid];
    if (isClozeAnswer(answer)) {
      const newAnswers = [...answer];
      newAnswers[index] = "";
      handleAnswerChange(qid, newAnswers);
    }
  };

  const handleSubmit = async () => {
    try {
      await API.post(`/forms/${id}/responses`, { 
        responder, 
        answers: Object.entries(answers).map(([qid, value]) => ({ qid, value }))
      });
      alert("Response submitted successfully!");
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Submission failed");
      }
    }
  };

  if (!form) return <div className="text-center py-8">Loading form...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <style>{`
        .dragging {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          z-index: 1000;
        }
        .drop-target {
          background-color: rgba(0,255,0,0.1);
          border-color: #4CAF50 !important;
        }
        [data-draggable] {
          transition: all 0.2s ease;
        }
      `}</style>

      <div className="mb-4">
        {form.headerImageUrl && (
          <div className="mb-4">
            <img 
              src={form.headerImageUrl} 
              alt="Form header" 
              className="w-full h-auto rounded-lg object-cover max-h-64"
            />
          </div>
        )}
        <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
        {form.description && (
          <p className="text-gray-600 mb-6">{form.description}</p>
        )}
      </div>

      <div className="mb-6">
        <label className="block mb-1 font-medium">Your name (optional)</label>
        <input
          className="input input-bordered w-full"
          placeholder="Enter your name"
          value={responder}
          onChange={(e) => setResponder(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {form.questions.map((q) => (
          <div key={q.qid} className="card bg-base-100 shadow">
            <div className="card-body">
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

              {q.type === "cloze" && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {q.config.options?.map((opt: string, i: number) => {
                      const answer = answers[q.qid];
                      const isIncluded = isClozeAnswer(answer) ? answer.includes(opt) : false;
                      return (
                        <div
                          key={i}
                          className={`badge p-3 cursor-move transition-all ${
                            isIncluded ? 'badge-secondary opacity-50' : 'badge-outline hover:bg-base-200'
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, opt, "option", q.qid)}
                          onDragEnd={() => {
                            document.querySelectorAll<HTMLElement>(".dragging").forEach(el => {
                              el.classList.remove("dragging");
                              el.style.opacity = "1";
                            });
                          }}
                          data-draggable
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                  
                  {q.config.textWithBlanks && (
                    <div className="whitespace-pre-wrap">
                      {q.config.textWithBlanks.split('_____').map((part: string, i: number) => (
                        <span key={i}>
                          {part}
                          {i < (q.config.textWithBlanks?.split('_____').length ?? 1) - 1 && (
                            <span
                              className={`inline-flex items-center min-w-[100px] border-2 rounded p-1 mx-1 transition-colors ${
                                isClozeAnswer(answers[q.qid]) && (answers[q.qid] as ClozeAnswer)[i]
                                  ? 'border-success bg-success/10' 
                                  : 'border-dashed border-base-300 hover:border-primary'
                              }`}
                              onDrop={(e) => handleDrop(e, i.toString(), "blank", q.qid, i)}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                            >
                              {isClozeAnswer(answers[q.qid]) && (answers[q.qid] as ClozeAnswer)[i] && (
                                <>
                                  <span>{(answers[q.qid] as ClozeAnswer)[i]}</span>
                                  <button 
                                    className="ml-2 text-xs opacity-70 hover:text-error"
                                    onClick={() => removeClozeAnswer(q.qid, i)}
                                  >
                                    ✕
                                  </button>
                                </>
                              )}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {q.type === "categorize" && (
                <div className="space-y-4">
                  <div className="mt-6">
                    <h3 className="font-bold text-lg mb-2">Items to Categorize</h3>
                    <div className="flex flex-wrap gap-3 p-4 bg-base-200 rounded-lg min-h-[80px]">
                      {q.config.items?.filter((item: any) => {
                        const answer = answers[q.qid];
                        return !(isCategorizeAnswer(answer) && 
                          answer.items.find((i: any) => i.id === item.id && i.belongsTo));
                      }).map((item: any) => (
                        <div
                          key={item.id}
                          className="badge badge-outline p-3 cursor-grab hover:bg-base-300 transition-all"
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.id, "item", q.qid)}
                          onDragEnd={() => {
                            document.querySelectorAll<HTMLElement>(".dragging").forEach(el => {
                              el.classList.remove("dragging");
                              el.style.opacity = "1";
                            });
                          }}
                          data-draggable
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg">Categories</h3>
                  <div className="flex flex-wrap gap-4">
                    {q.config.categories?.map((cat: any) => {
                      const answer = answers[q.qid];
                      const categoryItems = isCategorizeAnswer(answer) 
                        ? q.config.items?.filter((item: any) => 
                            answer.items.find((i: any) => i.id === item.id && i.belongsTo === cat.label)
                          )
                        : [];
                      return (
                        <div
                          key={cat.id}
                          className="flex-1 min-w-[150px] max-w-[200px] border-2 border-primary rounded-lg p-3 bg-base-200 h-[150px] overflow-y-auto transition-colors"
                          onDrop={(e) => handleDrop(e, cat.label, "category", q.qid)}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                        >
                          <div className="font-medium text-center mb-2 sticky top-0 bg-base-200 pb-2">
                            {cat.label}
                          </div>
                          <div className="flex flex-col gap-2">
                            {categoryItems?.map((item: any) => (
                              <div
                                key={item.id}
                                className="badge badge-primary p-3 flex justify-between items-center"
                              >
                                {item.label}
                                <button 
                                  className="btn btn-circle btn-xs"
                                  onClick={() => removeItemFromCategory(q.qid, item.id)}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {q.type === "comprehension" && (
                <div className="space-y-6">
                  <div className="p-4 bg-base-200 rounded-lg">
                    <p className="whitespace-pre-line">{q.config.passage}</p>
                  </div>
                  
                  <div className="space-y-6">
                    {q.config.subQuestions?.map((sq: any, i: any) => {
                      const answer = answers[q.qid];
                      const selectedAnswer = isComprehensionAnswer(answer) 
                        ? answer.answers[i]?.answer 
                        : "";
                      return (
                        <div key={i} className="space-y-3">
                          <p className="font-medium text-lg">{sq.question}</p>
                          <div className="space-y-2">
                            {sq.options?.map((opt: any, j: any) => (
                              <label key={j} className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg cursor-pointer">
                                <input
                                  type="radio"
                                  name={`comprehension-${q.qid}-${i}`}
                                  className="radio radio-primary"
                                  checked={selectedAnswer === opt}
                                  onChange={() => handleComprehensionChange(q.qid, i, opt)}
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!["cloze", "categorize", "comprehension"].includes(q.type) && (
                <input
                  type="text"
                  className="input input-bordered w-full mt-2"
                  value={typeof answers[q.qid] === 'string' ? answers[q.qid] as string : ""}
                  onChange={(e) => handleAnswerChange(q.qid, e.target.value)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="btn btn-primary mt-6 w-full"
      >
        Submit Response
      </button>
    </div>
  );
}