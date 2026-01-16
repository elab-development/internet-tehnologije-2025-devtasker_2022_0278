import { Link } from "react-router-dom";

export default function Projects() {
  return (
    <div>
      <h2>Projects</h2>
      <p>List of projects here.</p>

      {/* TODO: map projects */}
      <Link to="/projects/1/board">Open Project 1 Board</Link>
    </div>
  );
}
