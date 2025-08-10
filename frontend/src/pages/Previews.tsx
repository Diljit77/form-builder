import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import type { Form } from "../types/From";
import { useThemeStore } from "../store/useAuthStore";

export default function PreviewPage() {
  const { id } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
const {theme}=useThemeStore();
  useEffect(() => {
    API.get(`/forms/${id}`)
      .then((res) => setForm(res.data))
      .catch(() => alert("Form not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-8">Loading form preview...</div>;
  if (!form) return <div className="text-center py-8">Form not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-4" data-theme={theme}>
      <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
      {form.description && <p className="text-gray-600 mb-6">{form.description}</p>}

      <div className="space-y-6">
        {form.questions.map((q, idx) => (
          <div key={q.qid} className="card bg-base-100 shadow p-4">
            <h2 className="card-title mb-4">{q.title || `Question ${idx + 1}`}</h2>

            {/* Cloze preview: show text with blanks as empty boxes */}
            {q.type === "cloze" && (
              <div className="whitespace-pre-wrap">
                {q.config.textWithBlanks?.split("_____").map((part: string, i: number) => (
                  <span key={i}>
                    {part}
                    {i < q.config.textWithBlanks.split("_____").length - 1 && (
                      <span className="inline-block w-[100px] h-6 border-2 rounded mx-1 bg-base-200" />
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Categorize preview: show categories and items (all items with their categories if any) */}
            {q.type === "categorize" && (
              <div>
                <h3 className="font-semibold mb-2">Categories & Items</h3>
                <div className="flex flex-wrap gap-6">
                  {q.config.categories?.map((cat: any) => {
                    const categoryItems = q.config.items?.filter(
                      (item: any) => item.belongsTo === cat.id
                    );
                    return (
                      <div key={cat.id} className="min-w-[150px] border p-3 rounded bg-base-200">
                        <div className="font-medium mb-2 text-center">{cat.label}</div>
                        <div className="flex flex-col gap-1">
                          {categoryItems?.length ? (
                            categoryItems.map((item: any) => (
                              <span
                                key={item.id}
                                className="badge badge-primary p-2 text-sm"
                              >
                                {item.label}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm italic text-gray-500">No items</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold mb-2">All Items</h3>
                  <div className="flex flex-wrap gap-3 p-3 bg-base-200 rounded">
                    {q.config.items?.map((item: any) => (
                      <span
                        key={item.id}
                        className="badge badge-outline p-3 text-sm cursor-not-allowed"
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Comprehension preview: show passage and questions with options, all disabled */}
            {q.type === "comprehension" && (
              <div>
                <div className="p-4 bg-base-200 rounded mb-4 whitespace-pre-line">
                  {q.config.passage}
                </div>

                {q.config.subQuestions?.map((sq: any, i: number) => (
                  <div key={sq.id} className="mb-6">
                    <p className="font-medium mb-2">{sq.question}</p>
                    <div className="flex flex-col gap-2">
                      {sq.options?.map((opt: string, j: number) => (
                        <label
                          key={j}
                          className="flex items-center gap-3 p-3 bg-base-300 rounded cursor-not-allowed select-none"
                        >
                          <input type="radio" disabled name={`comp-${q.qid}-${i}`} />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Default preview: show text or other types as plain text */}
            {!["cloze", "categorize", "comprehension"].includes(q.type) && (
              <div className="p-3 bg-base-200 rounded">{q.title || "(No content)"}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
