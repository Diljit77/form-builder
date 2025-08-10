import { useState } from "react";
import API from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/usethemeStore";

interface SignupForm {
  name: string;
  email: string;
  password: string;
}

export default function Signup() {
  const {theme}=useThemeStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<SignupForm>({ name: "", email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/signup", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err: any) {
      alert(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]" data-theme={theme}>
      <form onSubmit={handleSubmit} className="card w-96 bg-base-100 shadow-xl p-6 space-y-4">
        <h2 className="text-2xl font-bold text-center">Signup</h2>
        <input
          name="name"
          placeholder="Name"
          className="input input-bordered w-full"
          onChange={handleChange}
        />
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
        <button className="btn btn-primary w-full">Signup</button>
     <p className="text-center text-sm text-gray-600">
  Already have an account?{" "}
  <Link
    to="/login"
    className="link link-primary hover:underline"
  >
    login
  </Link>
</p>
      </form>
    </div>
  );
}

