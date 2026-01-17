import { useParams } from "react-router-dom";

export default function TaskDetails() {
  const { taskId } = useParams();

  return (
    <div>
      <h2>Task Details</h2>
      <p>Task ID: {taskId}.</p>

      <h3>Comments</h3>
      <p>Comments placeholder.</p>
    </div>
  );
}
