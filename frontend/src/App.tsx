import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./compontents/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import FillForm from "./pages/Fillform";

import Response from "./pages/Response";

import ViewResponse from "./pages/ViewResponse";


const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {

  return (
    <Router>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes inside Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <Layout>
                <Editor />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <Editor />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Public Fill Form (can be inside layout if you want) */}
        <Route
          path="/form/:id"
          element={
            <Layout>
              <FillForm />
            </Layout>
          }
        />
       
           <Route
          path="/responses"
          element={
            <Layout>
              <Response />
            </Layout>
          }
        />
          <Route
          path="/response/:id"
          element={
            <Layout>
              <ViewResponse />
            </Layout>
          }
        />

      </Routes>
    </Router>
  );
}
