import { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function MyTasks() {
  const API_BASE = "http://127.0.0.1:8000/api";

  const token = useMemo(() => {
    return (
      sessionStorage.getItem("token") 
    );
  }, []);

  const authHeaders = useMemo(() => {
    const headers = {
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return { headers };
  }, [token]);

  // Dropdown data
  const [projects, setProjects] = useState([]);
  const [tags, setTags] = useState([]);

  // Tasks
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error"); // "error" | "info"

  // Create form
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [selectedTagId, setSelectedTagId] = useState("");

  const [statusDraft, setStatusDraft] = useState({}); 
  const [commentDraft, setCommentDraft] = useState({}); 

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;

    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;

    if (Array.isArray(payload?.data?.projects)) return payload.data.projects;
    if (Array.isArray(payload?.projects)) return payload.projects;

    return [];
  };

  const setErr = (txt) => {
    setMessageType("error");
    setMessage(txt);
  };

  const setInfo = (txt) => {
    setMessageType("info");
    setMessage(txt);
  };

  const fetchProjects = async () => {
    const urlsToTry = [`${API_BASE}/my-projects`, `${API_BASE}/projects`];

    for (const url of urlsToTry) {
      try {
        const res = await axios.get(url, authHeaders);
        const list = normalizeList(res.data);
        if (list.length > 0 || url.endsWith("/my-projects")) {
          setProjects(list);
          return;
        }
      } catch (e) {
      }
    }

    setProjects([]);
  };

  const fetchTags = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tags/lookup`, authHeaders);
      const list = normalizeList(res.data);
      setTags(list);
    } catch (e) {
      setTags([]);
    }
  };

  //vracanje taskova iz baze
  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await axios.get(`${API_BASE}/my-tasks`, authHeaders);
      const list = normalizeList(res.data);

      setTasks(list);
      const draft = {};
      for (const t of list) {
        draft[t.id] = t.status || "created";
      }
      setStatusDraft(draft);
    } catch (e) {
      const status = e?.response?.status;
      if (!token) {
        setErr("Niste autorizovani. Potrebna je prijava.");
      } else if (status === 401) {
        setErr("Sesija je istekla ili token nije validan (401).");
      } else if (status === 403) {
        setErr("Nemate dozvolu za ovu akciju (403).");
      } else {
        setErr("Greška pri učitavanju taskova.");
      }
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Ako nema tokena, odmah poruka (da ne izgleda kao da je dropdown “prazan” bez razloga).
    if (!token) {
      setErr("Niste autorizovani. Potrebna je prijava.");
      return;
    }

    fetchProjects();
    fetchTags();
    fetchMyTasks();
  }, [token]);

  //kreiranje novog taska
  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!selectedProjectId) return setErr("Izaberi projekat pre kreiranja taska.");
    if (!title.trim()) return setErr("Naslov taska je obavezan.");

    try {
      setLoading(true);
      setMessage("");

      //sta se salje
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        tag_id: selectedTagId || null,
      };

      //zvanje backend rute
      await axios.post(
        `${API_BASE}/projects/${selectedProjectId}/my-tasks`,
        body,
        authHeaders
      );

      setInfo("Task je uspešno kreiran.");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      setSelectedTagId("");

      await fetchMyTasks();
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        e2?.response?.data?.errors?.title?.[0] ||
        "Greška pri kreiranju taska.";
      setErr(msg);
    } finally {
      setLoading(false); //kad se sve zavrsi, loading se stavlja na false
    }
  };

  //cuvanje azuriranog statusa
  const handleSaveStatus = async (taskId) => {
    try {
      setLoading(true);
      setMessage("");

      const newStatus = statusDraft[taskId] || "created";
      await axios.put(
        `${API_BASE}/my-tasks/${taskId}/status`,
        { status: newStatus },
        authHeaders
      );

      setInfo("Status je sačuvan.");
      await fetchMyTasks();
    } catch (e) {
      setErr("Greška pri čuvanju statusa.");
    } finally {
      setLoading(false);
    }
  };

  //novi komentar
  const handleAddComment = async (taskId) => {
    const text = (commentDraft[taskId] || "").trim();
    if (!text) return;

    try {
      setLoading(true);
      setMessage("");

      await axios.post(
        `${API_BASE}/my-tasks/${taskId}/comments`,
        { content: text },
        authHeaders
      );

      setCommentDraft((prev) => ({ ...prev, [taskId]: "" }));
      setInfo("Komentar dodat.");
      await fetchMyTasks();
    } catch (e) {
      setErr("Greška pri dodavanju komentara.");
    } finally {
      setLoading(false);
    }
  };

  //brisanje komentara
  const handleDeleteComment = async (commentId) => {
    try {
      setLoading(true);
      setMessage("");

      await axios.delete(`${API_BASE}/my-comments/${commentId}`, authHeaders);

      setInfo("Komentar obrisan.");
      await fetchMyTasks();
    } catch (e) {
      setErr("Greška pri brisanju komentara.");
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (s) => {
    const map = {
      created: "Created",
      started: "Started",
      in_progress: "In progress",
      done: "Done",
    };
    return map[s] || s;
  };

  const priorityLabel = (p) => {
    const map = { low: "Low", medium: "Medium", high: "High" };
    return map[p] || p;
  };

  const pillClassByIndex = (i) => {
    const classes = ["tagPill--pink", "tagPill--blue", "tagPill--dark", "tagPill--sand", "tagPill--wheat"];
    return classes[i % classes.length];
  };

  return (
    <div className="boardPage">
      <div className="boardHeader">
        <div>
          <h1>My Tasks</h1>
          <p className="boardSubtitle">
            Kreiraj lični task za projekat, promeni status i vodi diskusiju kroz komentare.
          </p>
        </div>

        <div className="boardHeaderActions">
          <button className="ctaButton ctaButton--alt" onClick={fetchMyTasks} disabled={loading}>
            Osveži
          </button>
        </div>
      </div>

      {message && (
        <div className={`boardMessage ${messageType === "error" ? "boardMessage--error" : ""}`}>
          {message}
        </div>
      )}

      <div className="boardTop">
        {/* CREATE */}
        <div className="boardCard">
          <h2>Novi task</h2>

          <form className="form" onSubmit={handleCreateTask}>
            <div className="form-group">
              <label>Projekat</label>
              <select
                className="form-control"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="">Izaberi projekat</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.title || `Projekat #${p.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Naslov</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Npr. Popraviti bug na login-u"
              />
            </div>

            <div className="form-group">
              <label>Opis</label>
              <textarea
                className="form-control boardTextarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kratak opis (opciono)."
              />
            </div>

            <div className="boardRow2">
              <div className="form-group">
                <label>Prioritet</label>
                <select
                  className="form-control"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Rok</label>
                <input
                  type="date"
                  className="form-control"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tag</label>
              <select
                className="form-control"
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value)}
              >
                <option value="">Bez taga</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.label || `Tag #${t.id}`}
                  </option>
                ))}
              </select>
            </div>

            <button className="ctaButton" type="submit" disabled={loading}>
              Kreiraj task
            </button>
          </form>
        </div>

        {/* INFO */}
        <div className="boardInfo">
          <h2>Napomena</h2>
          <div className="boardLegend">
            <span className="boardLegendItem">
              <span className="boardDot boardDot--created" /> Created
            </span>
            <span className="boardLegendItem">
              <span className="boardDot boardDot--started" /> Started
            </span>
            <span className="boardLegendItem">
              <span className="boardDot boardDot--progress" /> In progress
            </span>
            <span className="boardLegendItem">
              <span className="boardDot boardDot--done" /> Done
            </span>
          </div>

        </div>
      </div>

      {/* LIST */}
      {loading && <div className="boardMessage">Učitavanje...</div>}

      {!loading && tasks.length === 0 && (
        <div className="kanbanEmpty">Nema taskova za prikaz.</div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="kanbanCol">
          <div className="kanbanColHead">
            <div className="kanbanColTitle">Moji taskovi</div>
            <div className="kanbanColCount">{tasks.length}</div>
          </div>

          <div className="kanbanColBody">
            {tasks.map((t, idx) => {
              const comments = Array.isArray(t.comments) ? t.comments : [];
              const tagName = t.tag?.name || t.tag_name || null;

              return (
                <div key={t.id} className="taskCard">
                  <div className="taskTop">
                    <div>
                      <div className="taskTitle">{t.title || `Task #${t.id}`}</div>
                      <div className="taskMeta">
                        <span className={`tagPill ${pillClassByIndex(idx)}`}>
                          {statusLabel(t.status)}
                        </span>
                        <span className={`tagPill ${pillClassByIndex(idx + 1)}`}>
                          {priorityLabel(t.priority)}
                        </span>

                        {tagName && (
                          <span className={`tagPill ${pillClassByIndex(idx + 2)}`}>
                            {tagName}
                          </span>
                        )}

                        {(t.project?.name || t.project_name) && (
                          <span className="assigneePill">
                            {(t.project?.name || t.project_name)}
                          </span>
                        )}

                        {t.due_date && (
                          <span className="assigneePill">Rok: {t.due_date}</span>
                        )}
                      </div>
                    </div>

                    <div className="taskId">#{t.id}</div>
                  </div>

                  <div className={`taskDesc ${t.description ? "" : "taskDesc--empty"}`}>
                    {t.description || "Nema opisa."}
                  </div>

                  <div className="taskActions">
                    <div className="taskMove">
                      <select
                        className="form-control taskMoveSelect"
                        value={statusDraft[t.id] || t.status || "created"}
                        onChange={(e) =>
                          setStatusDraft((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                      >
                        <option value="created">Created</option>
                        <option value="started">Started</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <button
                      className="ctaButton"
                      type="button"
                      disabled={loading}
                      onClick={() => handleSaveStatus(t.id)}
                    >
                      Sačuvaj status
                    </button>
                  </div>

                  {/* COMMENTS */}
                  <div className="projectsInfoCard">
                    <h3>Komentari</h3>

                    {comments.length === 0 && (
                      <div className="projectsEmpty">Još uvek nema komentara.</div>
                    )}

                    {comments.length > 0 && (
                      <div className="kanbanColBody">
                        {comments.map((c) => (
                          <div key={c.id} className="taskCard">
                            <div className="taskTop">
                              <div>
                                <div className="tagsName">
                                  {c.user?.name || c.author?.name || "Korisnik"}
                                </div>
                                <div className="taskDesc">{c.content || c.text || ""}</div>
                              </div>

                              <button
                                className="ctaButton tagsDangerBtn"
                                type="button"
                                disabled={loading}
                                onClick={() => handleDeleteComment(c.id)}
                              >
                                Obriši
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="taskActions">
                      <input
                        className="form-control"
                        placeholder="Dodaj komentar..."
                        value={commentDraft[t.id] || ""}
                        onChange={(e) =>
                          setCommentDraft((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                      />
                      <button
                        className="ctaButton ctaButton--alt"
                        type="button"
                        disabled={loading || !(commentDraft[t.id] || "").trim()}
                        onClick={() => handleAddComment(t.id)}
                      >
                        Dodaj
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
