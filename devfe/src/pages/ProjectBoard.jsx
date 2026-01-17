import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

//moguci statusi za taskove, dozvoljeni u bazi
const STATUSES = [
  { key: "created", label: "Created" },
  { key: "started", label: "Started" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" }
];

export default function ProjectBoard() {
  const API_BASE = "http://127.0.0.1:8000/api";
  const token = sessionStorage.getItem("token");

  const { projectId } = useParams();
  const navigate = useNavigate();

  //helper axiosClient: kreiramo instancu sa baseURL i Authorization headerom.
// useMemo sprečava da se nova instanca pravi na svakom renderu.
  const axiosClient = useMemo(() => {
    return axios.create({
      baseURL: API_BASE,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }, [token]);

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [developers, setDevelopers] = useState([]);

  // New task form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagId, setTagId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [createError, setCreateError] = useState("");

  // Edit task
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({
    title: "",
    description: "",
    tag_id: "",
    assigned_to: "",
    status: "created",
    priority: "medium",
    due_date: "",
  });
  const [editError, setEditError] = useState("");

 // parseApiError pokušava da izvuče najkorisniju poruku iz backend odgovora.
// Ako postoji validation errors, uzima prvu poruku da bude jednostavno za UI.
  const parseApiError = (err) => {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Došlo je do greške. Pokušaj ponovo.";
    const validation = err?.response?.data?.errors;

    if (validation && typeof validation === "object") {
      const firstKey = Object.keys(validation)[0];
      const firstVal = validation[firstKey];
      if (Array.isArray(firstVal) && firstVal[0]) return firstVal[0];
    }
    return msg;
  };

  //vracanje svih taskova za projekat
  const fetchAll = async () => {
    try {
      setPageError("");
      setLoading(true);

      const [tasksRes, tagsRes, devsRes] = await Promise.all([
        axiosClient.get(`/projects/${projectId}/tasks`),
        axiosClient.get(`/tags/lookup`),
        axiosClient.get(`/projects/${projectId}/developers`),
      ]);

      setTasks(tasksRes?.data?.data || []);
      setTags(tagsRes?.data?.data || []);
      setDevelopers(devsRes?.data?.data || []);
    } catch (err) {
      setPageError(parseApiError(err));
      setTasks([]);
      setTags([]);
      setDevelopers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchAll();
  }, [token, projectId]);

  const groupByStatus = (statusKey) => {
    return tasks.filter((t) => t.status === statusKey);
  };

  const getTagName = (t) => t?.tag?.name || "Tag";
  const getAssigneeName = (t) => t?.assigned_to?.name || "Unassigned";

  // mapiranje tagova na neke boje
  const tagClass = (name) => {
    const s = (name || "").toLowerCase();
    if (s.includes("bug")) return "tagPill--pink";
    if (s.includes("ui")) return "tagPill--blue";
    if (s.includes("front")) return "tagPill--blue";
    if (s.includes("back")) return "tagPill--dark";
    if (s.includes("devops")) return "tagPill--sand";
    if (s.includes("test")) return "tagPill--wheat";
    if (s.includes("feature")) return "tagPill--sand";
    return "tagPill--blue";
  };

  //kreiranje taska za developera na projektu
  // Backend zahteva: title, tag_id, assigned_to (obavezno).
  // Nakon uspeha resetujemo formu i ponovo učitamo taskove (da tabela/board bude svež).
  const onCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    setPageError("");

    const t = title.trim();
    if (!t) {
      setCreateError("Unesi title");
      return;
    }
    if (!tagId) {
      setCreateError("Izaberi tag");
      return;
    }
    if (!assignedTo) {
      setCreateError("Izaberi developera");
      return;
    }

    try {
      await axiosClient.post(`/projects/${projectId}/tasks`, {
        title: t,
        description: description.trim() || null,
        tag_id: Number(tagId),
        assigned_to: Number(assignedTo),
        status: "created",
        priority: "medium",
        due_date: null,
      });

      setTitle("");
      setDescription("");
      setTagId("");
      setAssignedTo("");

      await fetchAll();
    } catch (err) {
      setCreateError(parseApiError(err));
    }
  };

  // startEdit prebacuje task karticu u edit mode i popunjava edit state trenutnim vrednostima.
  // cancelEdit gasi edit mode i briše edit state.
  const startEdit = (task) => {
    setEditError("");
    setEditingId(task.id);

    setEdit({
      title: task.title || "",
      description: task.description || "",
      tag_id: task?.tag?.id ? String(task.tag.id) : "",
      assigned_to: task?.assigned_to?.id ? String(task.assigned_to.id) : "",
      status: task.status || "created",
      priority: task.priority || "medium",
      due_date: task.due_date || "",
    });
  };

  const cancelEdit = () => {
    setEditError("");
    setEditingId(null);
    setEdit({
      title: "",
      description: "",
      tag_id: "",
      assigned_to: "",
      status: "created",
      priority: "medium",
      due_date: "",
    });
  };

  const saveEdit = async (task) => {
    setEditError("");
    setPageError("");

    const t = edit.title.trim();
    if (!t) {
      setEditError("Title ne može biti prazan");
      return;
    }
    if (!edit.tag_id) {
      setEditError("Izaberi tag");
      return;
    }
    if (!edit.assigned_to) {
      setEditError("Izaberi developera");
      return;
    }

    try {
      await axiosClient.put(`/tasks/${task.id}`, {
        title: t,
        description: edit.description?.trim() || null,
        tag_id: Number(edit.tag_id),
        assigned_to: Number(edit.assigned_to),
        status: edit.status,
        priority: edit.priority || "medium",
        due_date: edit.due_date || null,
      });

      cancelEdit();
      await fetchAll();
    } catch (err) {
      setEditError(parseApiError(err));
    }
  };

  //azuriranje taska
  const quickMove = async (task, newStatus) => {
    setPageError("");

    try {
      await axiosClient.put(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description || null,
        tag_id: task?.tag?.id,
        assigned_to: task?.assigned_to?.id,
        status: newStatus,
        priority: task.priority || "medium",
        due_date: task.due_date || null,
      });

      await fetchAll();
    } catch (err) {
      setPageError(parseApiError(err));
    }
  };

  return (
    <div className="boardPage">
      <div className="boardHeader">
        <div>
          <h1>Project board</h1>
          <p className="boardSubtitle">
            Organizuj taskove po statusu. Kreiraj task i dodeli ga developeru
          </p>
        </div>

        <div className="boardHeaderActions">
          <button
            type="button"
            className="ctaButton ctaButton--alt"
            onClick={() => navigate("/projects")}
          >
            Back to Projects
          </button>
        </div>
      </div>

      {pageError ? <div className="boardMessage boardMessage--error">{pageError}</div> : null}

      <div className="boardTop">
        <div className="boardCard">
          <h2>New task</h2>

          <form className="form" onSubmit={onCreate}>
            <div className="form-group">
              <label>Title</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="npr. Implement login UI"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control boardTextarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="kratak opis taska"
              />
            </div>

            <div className="boardRow2">
             <div className="form-group">
              <label>Tag</label>
              <select
                className="form-control"
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
              >
                <option value="">Select tag</option>
                {tags.map((tg) => (
                  <option key={tg.id} value={tg.id}>
                    {tg.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Assign to</label>
              <select
                className="form-control"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Select developer</option>
                {developers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value="created" disabled>
                <option value="created">Created</option>
              </select>
            </div>

            </div>

            {createError ? <div className="form-error">{createError}</div> : null}

            <button className="ctaButton" type="submit">
              Create task
            </button>
          </form>
        </div>

        <div className="boardInfo">
          <h2>Status</h2>
          <div className="boardLegend">
            <span className="boardLegendItem">
              <span className="boardDot boardDot--created" />
              Created
            </span>
            <span className="boardLegendItem">
              <span className="boardDot boardDot--started" />
              Started
            </span>
            <span className="boardLegendItem">
              <span className="boardDot boardDot--progress" />
              In progress
            </span>
            <span className="boardLegendItem">
              <span className="boardDot boardDot--done" />
              Done
            </span>
          </div>

          <div className="boardSmallInfo">
            {loading ? "Loading..." : `Tasks loaded: ${tasks.length}`}
          </div>
        </div>
      </div>

      <div className="kanban">
        {STATUSES.map((col) => {
          const items = groupByStatus(col.key);

          return (
            <div className="kanbanCol" key={col.key}>
              <div className="kanbanColHead">
                <div className="kanbanColTitle">{col.label}</div>
                <div className="kanbanColCount">{items.length}</div>
              </div>

              <div className="kanbanColBody">
                {items.map((t) => {
                  const isEditing = editingId === t.id;

                  return (
                    <div className="taskCard" key={t.id}>
                      <div className="taskTop">
                        <div className="taskTitle">{t.title}</div>
                        <div className="taskId">#{t.id}</div>
                      </div>

                      <div className="taskMeta">
                        <span className={`tagPill ${tagClass(getTagName(t))}`}>
                          {getTagName(t)}
                        </span>
                        <span className="assigneePill">{getAssigneeName(t)}</span>
                      </div>

                      {!isEditing ? (
                        <>
                          {t.description ? (
                            <div className="taskDesc">{t.description}</div>
                          ) : (
                            <div className="taskDesc taskDesc--empty">No description</div>
                          )}

                          <div className="taskActions">
                            <button
                              type="button"
                              className="ctaButton ctaButton--alt"
                              onClick={() => startEdit(t)}
                            >
                              Edit
                            </button>

                            <div className="taskMove">
                              <select
                                className="form-control taskMoveSelect"
                                value={t.status}
                                onChange={(e) => quickMove(t, e.target.value)}
                              >
                                {STATUSES.map((s) => (
                                  <option key={s.key} value={s.key}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="taskEdit">
                            <div className="form-group">
                              <label>Title</label>
                              <input
                                className="form-control"
                                value={edit.title}
                                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                              />
                            </div>

                            <div className="form-group">
                              <label>Description</label>
                              <textarea
                                className="form-control boardTextarea"
                                value={edit.description}
                                onChange={(e) =>
                                  setEdit({ ...edit, description: e.target.value })
                                }
                              />
                            </div>

                            <div className="boardRow2">
                              <div className="form-group">
                                <label>Tag</label>
                                <select
                                  className="form-control"
                                  value={edit.tag_id}
                                  onChange={(e) => setEdit({ ...edit, tag_id: e.target.value })}
                                >
                                  <option value="">Select tag</option>
                                  {tags.map((tg) => (
                                    <option key={tg.id} value={tg.id}>
                                      {tg.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="form-group">
                                <label>Assign to</label>
                                <select
                                  className="form-control"
                                  value={edit.assigned_to}
                                  onChange={(e) =>
                                    setEdit({ ...edit, assigned_to: e.target.value })
                                  }
                                >
                                  <option value="">Select developer</option>
                                  {developers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="form-group">
                              <label>Status</label>
                              <select
                                className="form-control"
                                value={edit.status}
                                onChange={(e) => setEdit({ ...edit, status: e.target.value })}
                              >
                                {STATUSES.map((s) => (
                                  <option key={s.key} value={s.key}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {editError ? <div className="form-error">{editError}</div> : null}
                          </div>

                          <div className="taskActions">
                            <button
                              type="button"
                              className="ctaButton"
                              onClick={() => saveEdit(t)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="ctaButton ctaButton--alt"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

                {items.length === 0 ? (
                  <div className="kanbanEmpty">No tasks</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
