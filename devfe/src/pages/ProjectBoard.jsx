import { useParams } from "react-router-dom";

export default function ProjectBoard() {
  const { projectId } = useParams();

  return (
    <div>
      <h2>Project Board</h2>
      <p>Project ID: {projectId}.</p>
    </div>
  );
}
