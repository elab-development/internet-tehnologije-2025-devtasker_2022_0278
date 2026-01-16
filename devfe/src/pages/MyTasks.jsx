import { Link } from "react-router-dom";

export default function MyTasks() {
  return (
    <div>
      <h2>My Tasks</h2>
      <p>Tasks assigned to the developer.</p>

      {/* TODO: map tasks */}
      <Link to="/tasks/101">Open Task 101</Link>
    </div>
  );
}
