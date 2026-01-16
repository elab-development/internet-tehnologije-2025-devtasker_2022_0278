import { Link } from "react-router-dom";

export default function Home() {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  return (
    <div className="home">
      <div className="home__content">
        <div className="home__text">
          <h1>Welcome to Dev Tasker</h1>
          {!token && (
            <>
              <p>Your collaborative platform for managing projects and tasks with ease.</p>
              <div className="home__actions">
                <Link to="/login" className="ctaButton">Login</Link>
                <Link to="/register" className="ctaButton ctaButton--alt">Register</Link>
              </div>
            </>
          )}

          {token && role === "product_owner" && (
            <>
              <p>Quick access to your workspace:</p>
              <div className="home__actions">
                <Link to="/projects" className="ctaButton">Projects</Link>
                <Link to="/metrics" className="ctaButton ctaButton--alt">Metrics</Link>
              </div>
            </>
          )}

          {token && role === "developer" && (
            <>
              <p>Ready to code?</p>
              <Link to="/my-tasks" className="ctaButton">My Tasks</Link>
            </>
          )}

          {token && role === "taskadmin" && (
            <>
              <p>Manage tagging system below:</p>
              <Link to="/tags" className="ctaButton">Tags</Link>
            </>
          )}
        </div>

        <div className="home__image">
          <img src="/slika3.png" alt="Teamwork Illustration" />
        </div>
      </div>
    </div>
  );
}
