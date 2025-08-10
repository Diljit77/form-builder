import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import { useThemeStore } from '../store/usethemeStore';

interface Responder {
  _id: string;
  name?: string;
  email?: string;
}

interface RecentResponse {
  _id: string;
  responder?: Responder;
  submittedAt: string;
}

interface FormWithResponses {
  _id: string;
  title: string;
  description?: string;
  responseCount: number;
  recentResponses: RecentResponse[];
}

function ResponsePage() {
  const { theme } = useThemeStore();
  const [forms, setForms] = useState<FormWithResponses[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await API.get<FormWithResponses[]>("/forms/form/mine");
        setForms(res.data);
      } catch (err) {
        console.error("Failed to fetch forms", err);
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10" data-theme={theme}>
        <span className="loading loading-spinner loading-lg"></span>
        <p>Loading responses...</p>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500" data-theme={theme}>
        No responses yet.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" data-theme={theme}>
      <h1 className="text-3xl font-bold mb-8">Responses</h1>

      <div className="space-y-8"> {/* Changed from grid to space-y for better vertical spacing */}
        {forms.map((form) => (
          <div key={form._id} className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="card-title text-xl mb-1">{form.title}</h2>
                  {form.description && (
                    <p className="text-gray-500">{form.description}</p>
                  )}
                </div>
                <div className="badge badge-info">
                  {form.responseCount} {form.responseCount === 1 ? "response" : "responses"}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Recent Responses</h3>
                {form.recentResponses.length > 0 ? (
                  <div className="space-y-3"> {/* Consistent spacing between responses */}
                    {form.recentResponses.map((response) => (
                      <div key={response._id} className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                        <div>
                          <p className="font-medium">
                            {response.responder?.name || "Anonymous"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(response.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <Link
                          to={`/response/${response._id}`}
                          className="btn btn-sm btn-secondary"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <span>No responses yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResponsePage;