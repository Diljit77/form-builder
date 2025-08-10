import { Link, useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/usethemeStore";
import ThemeSelector from "./ThemeSelector";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
const {theme}=useThemeStore();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="navbar bg-base-200 shadow-md" data-theme={theme}>
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost normal-case text-xl font-bold">
          FormBuilder
        </Link>
      </div>
      <div className="flex-none gap-4">
        {token ? (
          <>
          <ThemeSelector />

            <Link to="/editor" className="btn btn-primary btn-sm ml-2 mr-2">
              Create Form
            </Link>
            <button onClick={handleLogout} className="btn btn-error btn-sm">
              Logout
            </button>

          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary btn-sm">
              Signup
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

