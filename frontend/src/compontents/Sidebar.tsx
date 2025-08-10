// components/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { useThemeStore } from "../store/useAuthStore";

export default function Sidebar() {
  const location = useLocation();
  const {theme}=useThemeStore();
  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Create Form", path: "/editor" },

    { name: "Responses", path: "/responses" },
  ];

  return (
    <div className="w-60 min-h-screen bg-base-200 p-4" data-theme={theme}>
      <h2 className="text-lg font-bold mb-6">Menu</h2>
      <ul className="menu bg-base-200 rounded-box">
        {menuItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={location.pathname === item.path ? "active" : ""}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
