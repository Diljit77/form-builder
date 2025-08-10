import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import { useThemeStore } from '../store/useAuthStore';

interface Responder {
  _id: string;
  name: string;
  email: string;
}

interface RecentResponse {
  _id: string;
  responder: Responder;
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <div key={form._id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-all">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <h2 className="card-title text-xl">{form.title}</h2>
                <div className="badge badge-info">
                  {form.responseCount} {form.responseCount === 1 ? "response" : "responses"}
                </div>
              </div>

              <p className="text-gray-500 mt-1 line-clamp-2">
                {form.description || "No description provided"}
              </p>

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Recent Responses</h3>
                {form.recentResponses.length > 0 ? (
                  <ul className="space-y-3">
                    {form.recentResponses.map((response) => (
                      <li key={response._id} className="flex justify-between items-center text-sm border p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                      
                          <div>
                            <p className="font-medium">{response.responder.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(response.submittedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Link
                          to={`/response/${response._id}`}
                          className="btn btn-xs btn-secondary"
                        >
                          View Response
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="alert alert-warning py-2">
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
