import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMemo, useState } from "react";

import SideMenu from "./components/SideMenu";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Projects from "./pages/Projects";
import ProjectBoard from "./pages/ProjectBoard";
import Metrics from "./pages/Metrics";

import MyTasks from "./pages/MyTasks";
import TaskDetails from "./pages/TaskDetails";

import Tags from "./pages/Tags";

function getHomeRoute(role) {
  switch (role) {
    case "product_owner":
      return "/projects";
    case "developer":
      return "/my-tasks";
    case "taskadmin":
      return "/tags";
    default:
      return "/";
  }
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const role = user?.role || null;

  const homeRoute = useMemo(() => getHomeRoute(role), [role]);

  const onLoginSuccess = ({ token: newToken, user: newUser }) => {
    sessionStorage.setItem("token", newToken);
    sessionStorage.setItem("user", JSON.stringify(newUser));
    sessionStorage.setItem("role", newUser.role); 

    setToken(newToken);
    setUser(newUser);
  };

  const onLogoutSuccess = () => {
    sessionStorage.clear();
    setToken(null);
    setUser(null);
  };

  const requireAuth = (element) => {
    if (!token) return <Navigate to="/login" replace />;
    return element;
  };

  const requireRole = (allowed, element) => {
    if (!token) return <Navigate to="/login" replace />;
    if (!role || !allowed.includes(role)) return <Navigate to={homeRoute} replace />;
    return element;
  };

  return (
    <BrowserRouter>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/*SideMenu dobija stanje kao props */}
        <SideMenu token={token} role={role} onLogoutSuccess={onLogoutSuccess} />

        <main className="mainContent">
          <Routes>
            {/* Home: može ostati, ali ako je user ulogovan i ode na "/", vodi ga na njegov "home" */}
            <Route
              path="/"
              element={token ? <Navigate to={homeRoute} replace /> : <Home />}
            />

            <Route
              path="/login"
              element={
                token ? (
                  <Navigate to={homeRoute} replace />
                ) : (
                  <Login onLoginSuccess={onLoginSuccess} />
                )
              }
            />

            <Route
              path="/register"
              element={token ? <Navigate to={homeRoute} replace /> : <Register />}
            />

            {/* Product Owner */}
            <Route
              path="/projects"
              element={requireRole(["product_owner"], <Projects />)}
            />
            <Route
              path="/projects/:projectId/board"
              element={requireRole(["product_owner"], <ProjectBoard />)}
            />
            <Route
              path="/metrics"
              element={requireRole(["product_owner"], <Metrics />)}
            />

            {/* Developer */}
            <Route
              path="/my-tasks"
              element={requireRole(["developer"], <MyTasks />)}
            />
            <Route
              path="/tasks/:taskId"
              element={requireRole(["developer"], <TaskDetails />)}
            />

            {/* Admin */}
            <Route
              path="/tags"
              element={requireRole(["taskadmin"], <Tags />)}
            />

            {/* fallback */}
            <Route path="*" element={<Navigate to={token ? homeRoute : "/"} replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
