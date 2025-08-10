import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import { useThemeStore } from "../store/useAuthStore";

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
  createdAt: string;
  updatedAt: string;
  responseCount: number;
  recentResponses: RecentResponse[];
}

export default function Dashboard() {
  const { theme } = useThemeStore();
  const [forms, setForms] = useState<FormWithResponses[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserForms = async () => {
      try {
        const res = await API.get<FormWithResponses[]>("/forms/form/mine");
        setForms(res.data);
      } catch (err) {
        console.error("Failed to fetch forms", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserForms();
  }, []);

  if (loading) return (
    <div className="text-center py-10" data-theme={theme}>
      <span className="loading loading-spinner loading-lg"></span>
      <p>Loading your forms...</p>
    </div>
  );

  if (forms.length === 0) return (
    <div className="text-center py-10" data-theme={theme}>
      <div className="alert alert-info max-w-md mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>No forms created yet.</span>
        <Link to="/editor" className="btn btn-sm btn-primary ml-2">+ New Form</Link>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto" data-theme={theme}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Forms</h1>
        <Link to="/editor" className="btn btn-primary gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Form
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <div key={form._id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-all">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <h2 className="card-title text-xl">{form.title}</h2>
                <div className="badge badge-info">
                  {form.responseCount} {form.responseCount === 1 ? 'response' : 'responses'}
                </div>
              </div>
              
              <p className="text-gray-500 mt-1 line-clamp-2">
                {form.description || "No description provided"}
              </p>
              
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Recent Responses</h3>
                {form.recentResponses.length > 0 ? (
                  <ul className="space-y-2">
                    {form.recentResponses.map((response) => (
                      <li key={response._id} className="flex items-center gap-2 text-sm">
                
                        <div>
                          <p className="font-medium">{response.responder.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(response.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="alert alert-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>No responses yet</span>
                  </div>
                )}
              </div>

              <div className="card-actions justify-end mt-4">
                <div className="flex flex-wrap gap-2">
                  <Link to={`/form/${form._id}`} className="btn btn-sm btn-outline">
                    Fill
                  </Link>
                  <Link to={`/responses`} className="btn btn-sm btn-secondary">
                    Responses
                  </Link>
                  <Link to={`/editor/${form._id}`} className="btn btn-sm btn-primary">
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
