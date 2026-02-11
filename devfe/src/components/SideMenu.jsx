import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHome, FaProjectDiagram, FaTasks, FaTags, FaSignOutAlt } from "react-icons/fa";

export default function SideMenu({ token, role, onLogoutSuccess }) {
  const navigate = useNavigate();

  const linkClass = ({ isActive }) => `sideMenu__link ${isActive ? "active" : ""}`;

  const onLogout = async () => {
    // pokušaj backend logouta
    try {
      if (token) {
        await axios.post(
          "http://127.0.0.1:8000/api/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      // čak i ako backend fail-uje, lokalno logout mora da uspe
      console.error("Logout failed", err);
    }

    //očisti app state + storage preko App-a
    onLogoutSuccess();

    // redirect
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sideMenu">
      <div className="sideMenu__brand">
        <div className="sideMenu__title">Dev Tasker</div>
        <div className="sideMenu__meta">
          {token ? `Role: ${role}` : "Not logged in"}
        </div>
      </div>

      <nav className="sideMenu__nav">
        {/* Ako nismo logovani, Home je "/" */}
        {!token && (
          <NavLink to="/" end className={linkClass}>
            <FaHome /> Home
          </NavLink>
        )}

        {/* Ako smo logovani, Home vodi na role-home (projects/my-tasks/tags) */}
        {token && role === "product_owner" && (
          <NavLink to="/projects" className={linkClass}>
            <FaProjectDiagram /> Projects
          </NavLink>
        )}
       {role === "developer" ? (
          <>
            <NavLink className="sideMenu__link" to="/dev">
              Home
            </NavLink>
            <NavLink className="sideMenu__link" to="/my-tasks">
              My tasks
            </NavLink>
            <NavLink className="sideMenu__link" to="/youtube">
              Youtube
            </NavLink>
          </>
        ) : null}
        {token && role === "taskadmin" && (
          <NavLink to="/tags" className={linkClass}>
            <FaTags /> Tags
          </NavLink>
        )}

        {!token && (
          <>
            <NavLink to="/login" className={linkClass}>
              <FaTasks /> Login
            </NavLink>
            <NavLink to="/register" className={linkClass}>
              <FaTasks /> Register
            </NavLink>
          </>
        )}

        {token && role === "product_owner" && (
          <NavLink to="/metrics" className={linkClass}>
            <FaTasks /> Metrics
          </NavLink>
        )}

        {token && (
          <button className="sideMenu__logout" onClick={onLogout} type="button">
            <FaSignOutAlt style={{ marginRight: 8 }} />
            Logout
          </button>
        )}
      </nav>
    </aside>
  );
}
