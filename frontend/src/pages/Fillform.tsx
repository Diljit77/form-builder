import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import type { Form } from "../types/From";

export default function FillForm() {
  const { id } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [responder, setResponder] = useState("");
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: string; qid: string } | null>(null);

  useEffect(() => {
    API.get(`/forms/${id}`)
      .then((res) => {
        setForm(res.data);
        // Initialize answers structure
        const initialAnswers = {};
        res.data.questions.forEach((q: any) => {
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
  };

  const handleDrop = (e: React.DragEvent, targetId: string, type: string, qid: string, blankIndex?: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (type === "category" && draggedItem.type === "item") {
      handleCategorizeChange(qid, draggedItem.id, targetId);
    } else if (type === "blank" && draggedItem.type === "option") {
      const newAnswers = [...answers[qid]];
      newAnswers[blankIndex!] = draggedItem.id;
      handleAnswerChange(qid, newAnswers);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAnswerChange = (qid: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  const handleCategorizeChange = (qid: string, itemId: string, categoryId: string) => {
    setAnswers(prev => {
      const updatedItems = prev[qid].items.map((item: any) => 
        item.id === itemId ? { ...item, belongsTo: categoryId } : item
      );
      return { ...prev, [qid]: { items: updatedItems } };
    });
  };

  const handleComprehensionChange = (qid: string, sqIndex: number, value: string) => {
    setAnswers(prev => {
      const updatedAnswers = [...prev[qid].answers];
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
    const newAnswers = [...answers[qid]];
    newAnswers[index] = "";
    handleAnswerChange(qid, newAnswers);
  };

  const handleSubmit = async () => {
    try {
      await API.post(`/forms/${id}/responses`, { 
        responder, 
        answers: Object.entries(answers).map(([qid, value]) => ({ qid, value }))
      });
      alert("Response submitted successfully!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Submission failed");
    }
  };

  if (!form) return <div className="text-center py-8">Loading form...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
      {form.description && (
        <p className="text-gray-600 mb-6">{form.description}</p>
      )}

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
              <h2 className="card-title">{q.title}</h2>
              
              {/* Cloze Question with Drag-and-Drop */}
              {q.type === "cloze" && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {q.config.options?.map((opt, i) => (
                      <div
                        key={i}
                        className={`badge p-3 cursor-move ${answers[q.qid]?.includes(opt) ? 'badge-secondary' : 'badge-outline'}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opt, "option", q.qid)}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                  
                  <div className="whitespace-pre-wrap">
                    {q.config.textWithBlanks?.split('_____').map((part, i) => (
                      <span key={i}>
                        {part}
                        {i < q.config.textWithBlanks.split('_____').length - 1 && (
                          <span
                            className={`inline-flex items-center min-w-[100px] border-2 rounded p-1 mx-1 ${answers[q.qid]?.[i] ? 'border-success' : 'border-dashed border-base-300'}`}
                            onDrop={(e) => handleDrop(e, i.toString(), "blank", q.qid, i)}
                            onDragOver={handleDragOver}
                          >
                            {answers[q.qid]?.[i] && (
                              <>
                                <span>{answers[q.qid][i]}</span>
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
                </div>
              )}

              {/* Categorize Question with Side-by-Side Categories */}
              {q.type === "categorize" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Categories</h3>
                  <div className="flex flex-wrap gap-4">
                    {q.config.categories?.map(cat => {
                      const categoryItems = q.config.items?.filter(item => 
                        answers[q.qid]?.items?.find(i => i.id === item.id && i.belongsTo === cat.id)
                      );
                      return (
                        <div
                          key={cat.id}
                          className="flex-1 min-w-[150px] max-w-[200px] border-2 border-primary rounded-lg p-3 bg-base-200 h-[150px] overflow-y-auto"
                          onDrop={(e) => handleDrop(e, cat.id, "category", q.qid)}
                          onDragOver={handleDragOver}
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
                  
                  <div className="mt-6">
                    <h3 className="font-bold text-lg mb-2">Items to Categorize</h3>
                    <div className="flex flex-wrap gap-3 p-4 bg-base-200 rounded-lg">
                      {q.config.items?.filter(item => 
                        !answers[q.qid]?.items?.find(i => i.id === item.id && i.belongsTo)
                      ).map(item => (
                        <div
                          key={item.id}
                          className="badge badge-outline p-3 cursor-grab hover:bg-base-300 transition-colors"
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.id, "item", q.qid)}
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Comprehension as Standard MCQ */}
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
                            <label key={j} className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg cursor-pointer">
                              <input
                                type="radio"
                                name={`comprehension-${q.qid}-${i}`}
                                className="radio radio-primary"
                                checked={answers[q.qid]?.answers?.[i]?.answer === opt}
                                onChange={() => handleComprehensionChange(q.qid, i, opt)}
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Default input for other types */}
              {!["cloze", "categorize", "comprehension"].includes(q.type) && (
                <input
                  type="text"
                  className="input input-bordered w-full mt-2"
                  value={answers[q.qid] || ""}
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