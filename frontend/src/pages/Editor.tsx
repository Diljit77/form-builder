import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import API from "../api/axios";
import type { Form, Question } from "../types/From";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { useThemeStore } from "../store/useAuthStore";

// Custom scroll behavior during drag
const scrollOnDrag = (e: MouseEvent) => {
  const { clientY } = e;
  const buffer = 100;
  const scrollSpeed = 10;
  const container = document.querySelector('.drag-container');

  if (!container) return;

  const { top, bottom } = container.getBoundingClientRect();

  if (clientY < top + buffer) {
    container.scrollTop -= scrollSpeed;
  } else if (clientY > bottom - buffer) {
    container.scrollTop += scrollSpeed;
  }
};

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [form, setForm] = useState<Form>({
    title: "",
    description: "",
    headerImageUrl: "",
    questions: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      API.get(`/forms/${id}`)
        .then((res) => setForm(res.data))
        .catch(() => alert("Failed to load form"));
    }
  }, [id]);

  useEffect(() => {
    window.addEventListener('mousemove', scrollOnDrag);
    return () => window.removeEventListener('mousemove', scrollOnDrag);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const addQuestion = () => {
    const newQ: Question = {
      qid: uuidv4(),
      type: "cloze",
      title: "Untitled Question",
      config: {},
    };
    setForm({ ...form, questions: [...form.questions, newQ] });
  };

  const handleQuestionChange = (
    index: number,
    key: keyof Question,
    value: any
  ) => {
    const updated = [...form.questions];
    updated[index] = { ...updated[index], [key]: value };
    setForm({ ...form, questions: updated });
  };

  const removeQuestion = (index: number) => {
    setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) });
  };

  const reorder = (list: any[], startIndex: number, endIndex: number) => {
    const result = [...list];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === "questions") {
      setForm({
        ...form,
        questions: reorder(form.questions, source.index, destination.index),
      });
      return;
    }

    const [listType, qid] = source.droppableId.split("::");
    const qIndex = form.questions.findIndex((q) => q.qid === qid);
    if (qIndex === -1) return;

    const config = { ...form.questions[qIndex].config };

    if (listType === "cats") {
      if (!config.categories) return;
      config.categories = reorder(config.categories, source.index, destination.index);
    } else if (listType === "items") {
      if (!config.items) return;
      config.items = reorder(config.items, source.index, destination.index);
    } else if (listType === "clozeOpts") {
      if (!config.options) return;
      config.options = reorder(config.options, source.index, destination.index);
    } else if (listType === "compQs") {
      if (!config.subQuestions) return;
      config.subQuestions = reorder(config.subQuestions, source.index, destination.index);
    }

    handleQuestionChange(qIndex, "config", config);
  };

  const saveForm = async () => {
    if (!form.title) return alert("Title is required");
    setLoading(true);
    try {
      if (id) {
        await API.put(`/forms/${id}`, form);
      } else {
        const res = await API.post("/forms", form);
        navigate(`/editor/${res.data._id}`);
      }
      alert("Form saved!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  // Drag handle icon component
  const DragHandle = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
      <path d="M8 7H12M8 12H16M8 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div data-theme={theme} className="pb-8">
      <h1 className="text-2xl font-bold">{id ? "Edit Form" : "Create Form"}</h1>

      <input
        className="input input-bordered w-full mt-4"
        name="title"
        placeholder="Form Title"
        value={form.title}
        onChange={handleChange}
      />

      <textarea
        className="textarea textarea-bordered w-full mt-2"
        name="description"
        placeholder="Form Description"
        value={form.description}
        onChange={handleChange}
      />

      <button className="btn btn-neutral mt-4" onClick={addQuestion}>
        + Add Question
      </button>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="main-questions" type="questions">
          {(provided) => (
            <div 
              ref={provided.innerRef} 
              {...provided.droppableProps} 
              className="mt-4 space-y-4 drag-container"
              style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
            >
              {form.questions.map((q, qIndex) => (
                <Draggable key={q.qid} draggableId={q.qid} index={qIndex}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        boxShadow: snapshot.isDragging ? "0 0 8px rgba(0,0,0,0.3)" : "none",
                        backgroundColor: snapshot.isDragging ? 'var(--fallback-b1,oklch(var(--b1)/1))' : '',
                      }}
                      className={`border p-4 rounded-lg bg-base-100 shadow transition-all duration-200 ${
                        snapshot.isDragging ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div 
                        {...provided.dragHandleProps} 
                        className="cursor-move mb-2 flex items-center gap-2 p-2 bg-base-200 rounded-lg"
                      >
                        <DragHandle />
                        <span>Drag to reorder</span>
                      </div>

                      <input
                        className="input input-bordered w-full mb-2"
                        value={q.title}
                        onChange={(e) => handleQuestionChange(qIndex, "title", e.target.value)}
                        placeholder="Question Title"
                      />

                      <select
                        className="select select-bordered w-full mb-4"
                        value={q.type}
                        onChange={(e) =>
                          handleQuestionChange(qIndex, "type", e.target.value as Question["type"])
                        }
                      >
                        <option value="cloze">Cloze</option>
                        <option value="categorize">Categorize</option>
                        <option value="comprehension">Comprehension</option>
                      </select>

                      {/* Categorize Question Type */}
                      {q.type === "categorize" && (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-bold mb-2">Categories</h3>
                            <Droppable droppableId={`cats::${q.qid}`} type="categories">
                              {(provided) => (
                                <div 
                                  ref={provided.innerRef} 
                                  {...provided.droppableProps}
                                  className="space-y-2 bg-base-200 p-3 rounded-lg min-h-[60px]"
                                >
                                  {(q.config.categories || []).map((cat: any, catIndex: number) => (
                                    <Draggable 
                                      key={`cat-${cat.id}`} 
                                      draggableId={`cat-${cat.id}`} 
                                      index={catIndex}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          style={{
                                            ...provided.draggableProps.style,
                                            transform: snapshot.isDragging 
                                              ? 'scale(1.02) rotate(1deg)' 
                                              : 'none',
                                            transition: 'all 0.2s ease',
                                          }}
                                          className={`flex items-center gap-2 p-2 rounded-lg ${
                                            snapshot.isDragging 
                                              ? 'bg-primary/20 border border-primary shadow-lg' 
                                              : 'bg-base-100 border border-base-300'
                                          }`}
                                        >
                                          <div 
                                            {...provided.dragHandleProps} 
                                            className="cursor-move p-1 hover:bg-base-300 rounded"
                                          >
                                            <DragHandle />
                                          </div>
                                          <input
                                            className="input input-bordered flex-1"
                                            value={cat.label}
                                            onChange={(e) => {
                                              const updatedCats = [...(q.config.categories || [])];
                                              updatedCats[catIndex].label = e.target.value;
                                              handleQuestionChange(qIndex, "config", {
                                                ...q.config,
                                                categories: updatedCats,
                                              });
                                            }}
                                          />
                                          <button
                                            className="btn btn-circle btn-error btn-sm"
                                            onClick={() => {
                                              const updatedCats = (q.config.categories || []).filter((_, i) => i !== catIndex);
                                              handleQuestionChange(qIndex, "config", {
                                                ...q.config,
                                                categories: updatedCats,
                                              });
                                            }}
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                            <button
                              className="btn btn-sm btn-primary mt-2"
                              onClick={() => {
                                const newCats = [...(q.config.categories || []), { id: uuidv4(), label: "" }];
                                handleQuestionChange(qIndex, "config", {
                                  ...q.config,
                                  categories: newCats,
                                });
                              }}
                            >
                              + Add Category
                            </button>
                          </div>

                          <div>
                            <h3 className="font-bold mt-4 mb-2">Items</h3>
                            <Droppable droppableId={`items::${q.qid}`} type="items">
                              {(provided) => (
                                <div 
                                  ref={provided.innerRef} 
                                  {...provided.droppableProps} 
                                  className="space-y-2 bg-base-200 p-3 rounded-lg min-h-[60px]"
                                >
                                  {(q.config.items || []).map((item: any, itemIndex: number) => (
                                    <Draggable 
                                      key={`item-${item.id}`} 
                                      draggableId={`item-${item.id}`} 
                                      index={itemIndex}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          style={{
                                            ...provided.draggableProps.style,
                                            transform: snapshot.isDragging 
                                              ? 'scale(1.02) rotate(1deg)' 
                                              : 'none',
                                            transition: 'all 0.2s ease',
                                          }}
                                          className={`flex items-center gap-2 p-2 rounded-lg ${
                                            snapshot.isDragging 
                                              ? 'bg-primary/20 border border-primary shadow-lg' 
                                              : 'bg-base-100 border border-base-300'
                                          }`}
                                        >
                                          <div 
                                            {...provided.dragHandleProps} 
                                            className="cursor-move p-1 hover:bg-base-300 rounded"
                                          >
                                            <DragHandle />
                                          </div>
                                          <input
                                            className="input input-bordered flex-1"
                                            value={item.label}
                                            onChange={(e) => {
                                              const updatedItems = [...(q.config.items || [])];
                                              updatedItems[itemIndex].label = e.target.value;
                                              handleQuestionChange(qIndex, "config", {
                                                ...q.config,
                                                items: updatedItems,
                                              });
                                            }}
                                          />
                                          <select
                                            className="select select-bordered"
                                            value={item.belongsTo}
                                            onChange={(e) => {
                                              const updatedItems = [...(q.config.items || [])];
                                              updatedItems[itemIndex].belongsTo = e.target.value;
                                              handleQuestionChange(qIndex, "config", {
                                                ...q.config,
                                                items: updatedItems,
                                              });
                                            }}
                                          >
                                            <option value="">Select category</option>
                                            {(q.config.categories || []).map((cat: any) => (
                                              <option key={cat.id} value={cat.label}>
                                                {cat.label || "(Unnamed)"}
                                              </option>
                                            ))}
                                          </select>
                                          <button
                                            className="btn btn-circle btn-error btn-sm"
                                            onClick={() => {
                                              const updatedItems = (q.config.items || []).filter((_, i) => i !== itemIndex);
                                              handleQuestionChange(qIndex, "config", {
                                                ...q.config,
                                                items: updatedItems,
                                              });
                                            }}
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                            <button
                              className="btn btn-sm btn-primary mt-2"
                              onClick={() => {
                                const newItems = [...(q.config.items || []), { id: uuidv4(), label: "", belongsTo: "" }];
                                handleQuestionChange(qIndex, "config", {
                                  ...q.config,
                                  items: newItems,
                                });
                              }}
                            >
                              + Add Item
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Cloze Question Type */}
                      {q.type === "cloze" && (
                        <div>
                          <h3 className="font-bold mb-2">Sentence</h3>
                          <textarea
                            id={`cloze-text-${q.qid}`}
                            className="textarea textarea-bordered w-full mb-2"
                            placeholder="Type your sentence here"
                            value={q.config.textWithBlanks || ""}
                            onChange={(e) =>
                              handleQuestionChange(qIndex, "config", {
                                ...q.config,
                                textWithBlanks: e.target.value,
                              })
                            }
                          />
                          <button
                            className="btn btn-sm btn-outline mb-4"
                            onClick={() => {
                              const textarea = document.getElementById(`cloze-text-${q.qid}`) as HTMLTextAreaElement;
                              if (!textarea) return;
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;

                              if (start === end) {
                                alert("Please select a word to mark as blank");
                                return;
                              }

                              const fullText = q.config.textWithBlanks || "";
                              const selectedWord = fullText.substring(start, end);

                              const newText = fullText.substring(0, start) + "_____" + fullText.substring(end);

                              handleQuestionChange(qIndex, "config", {
                                ...q.config,
                                textWithBlanks: newText,
                                options: [...(q.config.options || []), selectedWord],
                              });
                            }}
                          >
                            Mark as Blank
                          </button>

                          <h3 className="font-bold mb-2">Options</h3>
                          <Droppable droppableId={`clozeOpts::${q.qid}`} type="options">
                            {(provided) => (
                              <div 
                                ref={provided.innerRef} 
                                {...provided.droppableProps} 
                                className="space-y-2 bg-base-200 p-3 rounded-lg min-h-[60px]"
                              >
                                {(q.config.options || []).map((opt: string, optIndex: number) => (
                                  <Draggable 
                                    key={`opt-${q.qid}-${optIndex}`} 
                                    draggableId={`opt-${q.qid}-${optIndex}`} 
                                    index={optIndex}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        style={{
                                          ...provided.draggableProps.style,
                                          transform: snapshot.isDragging 
                                            ? 'scale(1.02) rotate(1deg)' 
                                            : 'none',
                                          transition: 'all 0.2s ease',
                                        }}
                                        className={`flex items-center gap-2 p-2 rounded-lg ${
                                          snapshot.isDragging 
                                            ? 'bg-primary/20 border border-primary shadow-lg' 
                                            : 'bg-base-100 border border-base-300'
                                        }`}
                                      >
                                        <div 
                                          {...provided.dragHandleProps} 
                                          className="cursor-move p-1 hover:bg-base-300 rounded"
                                        >
                                          <DragHandle />
                                        </div>
                                        <input
                                          className="input input-bordered w-full"
                                          value={opt}
                                          onChange={(e) => {
                                            const updatedOpts = [...(q.config.options || [])];
                                            updatedOpts[optIndex] = e.target.value;
                                            handleQuestionChange(qIndex, "config", {
                                              ...q.config,
                                              options: updatedOpts,
                                            });
                                          }}
                                        />
                                        <button
                                          className="btn btn-circle btn-error btn-sm"
                                          onClick={() => {
                                            const updatedOpts = (q.config.options || []).filter((_, i) => i !== optIndex);
                                            handleQuestionChange(qIndex, "config", {
                                              ...q.config,
                                              options: updatedOpts,
                                            });
                                          }}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}

                      {/* Comprehension Question Type */}
                      {q.type === "comprehension" && (
                        <div>
                          <h3 className="font-bold mb-2">Passage</h3>
                          <textarea
                            className="textarea textarea-bordered w-full mb-4"
                            placeholder="Enter passage text"
                            value={q.config.passage || ""}
                            onChange={(e) =>
                              handleQuestionChange(qIndex, "config", {
                                ...q.config,
                                passage: e.target.value,
                              })
                            }
                          />

                          <h3 className="font-bold mb-2">Sub-Questions</h3>
                          <Droppable droppableId={`compQs::${q.qid}`} type="subQuestions">
                            {(provided) => (
                              <div 
                                ref={provided.innerRef} 
                                {...provided.droppableProps} 
                                className="space-y-2 bg-base-200 p-3 rounded-lg min-h-[60px]"
                              >
                                {(q.config.subQuestions || []).map((sq: any, sqIndex: number) => (
                                  <Draggable 
                                    key={`sq-${sq.id}`} 
                                    draggableId={`sq-${sq.id}`} 
                                    index={sqIndex}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        style={{
                                          ...provided.draggableProps.style,
                                          transform: snapshot.isDragging 
                                            ? 'scale(1.02) rotate(1deg)' 
                                            : 'none',
                                          transition: 'all 0.2s ease',
                                        }}
                                        className={`border p-3 rounded-lg ${
                                          snapshot.isDragging 
                                            ? 'bg-primary/20 border border-primary shadow-lg' 
                                            : 'bg-base-100'
                                        }`}
                                      >
                                        <div 
                                          {...provided.dragHandleProps} 
                                          className="cursor-move mb-2 flex items-center gap-2 hover:bg-base-300 p-1 rounded"
                                        >
                                          <DragHandle />
                                          <span>Drag to reorder</span>
                                        </div>
                                        <input
                                          className="input input-bordered w-full mb-2"
                                          placeholder="Sub-question"
                                          value={sq.question}
                                          onChange={(e) => {
                                            const newSQ = [...(q.config.subQuestions || [])];
                                            newSQ[sqIndex].question = e.target.value;
                                            handleQuestionChange(qIndex, "config", {
                                              ...q.config,
                                              subQuestions: newSQ,
                                            });
                                          }}
                                        />
                                        <h4 className="font-medium mb-1">Options</h4>
                                        {(sq.options || []).map((opt: string, optIndex: number) => (
                                          <div key={optIndex} className="flex items-center gap-2 mb-1">
                                            <input
                                              className="input input-bordered w-full"
                                              placeholder={`Option ${optIndex + 1}`}
                                              value={opt}
                                              onChange={(e) => {
                                                const newSQ = [...(q.config.subQuestions || [])];
                                                newSQ[sqIndex].options[optIndex] = e.target.value;
                                                handleQuestionChange(qIndex, "config", {
                                                  ...q.config,
                                                  subQuestions: newSQ,
                                                });
                                              }}
                                            />
                                            <button
                                              className="btn btn-circle btn-error btn-sm"
                                              onClick={() => {
                                                const newSQ = [...(q.config.subQuestions || [])];
                                                newSQ[sqIndex].options = newSQ[sqIndex].options.filter((_: any, i: number) => i !== optIndex);
                                                handleQuestionChange(qIndex, "config", {
                                                  ...q.config,
                                                  subQuestions: newSQ,
                                                });
                                              }}
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        ))}
                                        <div className="mt-2">
                                          <button
                                            className="btn btn-xs btn-primary"
                                            onClick={() => {
                                              const newSQ = [...(q.config.subQuestions || [])];
                                              newSQ[sqIndex].options.push("");
                                              handleQuestionChange(qIndex, "config", {
                                                ...q.config,
                                                subQuestions: newSQ,
                                              });
                                            }}
                                          >
                                            + Add Option
                                          </button>
                                          <button
                                            className="btn btn-xs btn-error ml-2"
                                            onClick={() => {
                                              const newSQ = (q.config.subQuestions || []).filter((_: any, i: number) => i !== sqIndex);
                                              handleQuestionChange(qIndex, "config", {
                                                ...q.config,
                                                subQuestions: newSQ,
                                              });
                                            }}
                                          >
                                            Remove Question
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>

                          <button
                            className="btn btn-sm btn-primary mt-2"
                            onClick={() => {
                              const newSQ = [...(q.config.subQuestions || []), { id: uuidv4(), question: "", options: [] }];
                              handleQuestionChange(qIndex, "config", {
                                ...q.config,
                                subQuestions: newSQ,
                              });
                            }}
                          >
                            + Add Sub-Question
                          </button>
                        </div>
                      )}

                      <button
                        className="btn btn-sm btn-error mt-4"
                        onClick={() => removeQuestion(qIndex)}
                      >
                        Remove Question
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button onClick={saveForm} className="btn btn-primary mt-6" disabled={loading}>
        {loading ? "Saving..." : "Save Form"}
      </button>
    </div>
  );
}