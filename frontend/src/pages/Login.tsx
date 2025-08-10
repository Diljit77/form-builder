import { useState } from "react";
import API from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/usethemeStore";

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const {theme}=useThemeStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err: any) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]" data-theme={theme}>
      <form onSubmit={handleSubmit} className="card w-96 bg-base-100 shadow-xl p-6 space-y-4">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        <input
          name="email"
          placeholder="Email"
          type="email"
          className="input input-bordered w-full"
          onChange={handleChange}
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          className="input input-bordered w-full"
          onChange={handleChange}
        />
        <button className="btn btn-primary w-full">Login</button>
         <p className="text-center text-sm text-gray-600">
  Don’t have an account?{" "}
  <Link
    to="/signup"
    className="link link-primary hover:underline"
  >
    Signup
  </Link>
</p>
      </form>
    </div>
  );
}
