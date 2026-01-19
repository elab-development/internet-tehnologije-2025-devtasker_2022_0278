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
        </div>

        <div className="home__image">
          <img src="/slika3.png" alt="Teamwork Illustration" />
        </div>
      </div>
    </div>
  );
}
