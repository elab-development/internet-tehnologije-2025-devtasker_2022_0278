import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Projects() {
  const API_BASE = "http://127.0.0.1:8000/api";

  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");
  const canAccess = role === "product_owner";

  const navigate = useNavigate();

  //pomoc da lakse pisemo zahteve - vec postavimo token i accept
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

  //promenljive koje ce nam trebati
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  //sta se ispisuje u slucaju greske
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

  //vracanje projekata sa backenda
  const fetchProjects = async () => {
    try {
      setPageError("");
      setLoading(true);

      const res = await axiosClient.get("/projects");
      const rows = res?.data?.data || [];
      setProjects(rows);
    } catch (err) {
      setPageError(parseApiError(err));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    if (!canAccess) return;
    fetchProjects();
  }, [token, canAccess]);

  //create fja sa backenda koju zovemo preko axiosa i saljemo podatke sa forme
  const onCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setPageError("");

    const t = title.trim();
    if (!t) {
      setFormError("Unesi naziv projekta.");
      return;
    }

    try {
      await axiosClient.post("/projects", {
        title: t,
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
      });

      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");

      await fetchProjects();
    } catch (err) {
      setFormError(parseApiError(err));
    }
  };

  //fja za navigaciju na osnovu koji projekat kliknemo, da nas odvede na taj board
  const openBoard = (projectId) => {
    navigate(`/projects/${projectId}/board`);
  };

  //ako nema tokena u session storageu
  if (!token) {
    return (
      <div className="mainContent">
        <h1>Projects</h1>
        <p>Moraš biti ulogovana da bi pristupila ovoj stranici</p>
      </div>
    );
  }

  //ako nema pristup
  if (!canAccess) {
    return (
      <div className="mainContent">
        <h1>Projects</h1>
        <p>Nemaš dozvolu da pristupiš Projects stranici</p>
      </div>
    );
  }

  //sredjivanje formata
  const formatDateShort = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

    return d.toLocaleDateString("sr-RS", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="projectsPage">
      <div className="projectsHeader">
        <div>
          <h1>Projects</h1>
          <p className="projectsSubtitle">
            Kreiraš projekte i ulaziš u njihov board gde upravljaš taskovima po statusima
          </p>
        </div>

        <div className="projectsHeaderRight">
          <span className="projectsPill">Product Owner</span>
        </div>
      </div>

      {pageError ? (
        <div className="projectsMessage projectsMessage--error">{pageError}</div>
      ) : null}

      <div className="projectsTop">
        <div className="projectsCard">
          <h2>New project</h2>
          <p className="projectsHelp">
            Popuni osnovne informacije i kreiraj projekat. Nakon kreiranja, otvori board i dodaj taskove
          </p>

          <form className="form" onSubmit={onCreate}>
            <div className="form-group">
              <label>Title</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="npr. AI Pilot Project"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control projectsTextarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="kratak opis projekta"
              />
            </div>

            <div className="projectsDates">
              <div className="form-group">
                <label>Start date</label>
                <input
                  className="form-control"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>End date</label>
                <input
                  className="form-control"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {formError ? <div className="form-error">{formError}</div> : null}

            <button className="ctaButton" type="submit">
              Create project
            </button>
          </form>
        </div>

        <div className="projectsInfoCard">
          <h2>How it works</h2>

          <ul className="projectsList">
            <li>Kreiraš projekat</li>
            <li>Ulaziš u board</li>
            <li>Dodaješ taskove i dodeljuješ ih developerima</li>
            <li>Menjaš status taskova: created, started, in progress</li>
          </ul>

          <div className="projectsStatRow">
            <div className="projectsStat">
              <div className="projectsStatValue">{projects.length}</div>
              <div className="projectsStatLabel">Projects</div>
            </div>

            <div className="projectsStat">
              <div className="projectsStatValue">{loading ? "..." : "OK"}</div>
              <div className="projectsStatLabel">Status</div>
            </div>
          </div>
        </div>
      </div>

      <div className="projectsGridHeader">
        <h2>My projects</h2>
        <div className="projectsGridMeta">
          {loading ? "Loading..." : `Total: ${projects.length}`}
        </div>
      </div>

      <div className="projectsGrid">
        {(!loading && projects.length === 0) ? (
          <div className="projectsEmpty">
            Nema projekata. Kreiraj prvi projekat gore
          </div>
        ) : null}

        {projects.map((p) => (
          <div className="projectCard" key={p.id}>
            <div className="projectCardTop">
              <div className="projectTitle">{p.title}</div>
              <div className="projectId">#{p.id}</div>
            </div>

            <div className="projectDesc">
              {p.description ? p.description : "Nema opisa"}
            </div>

            <div className="projectDates">
              <div>
                <span className="projectDateLabel">Start</span>{" "}
                <span className="projectDateValue">{formatDateShort(p.start_date)}</span>
              </div>
              <div>
                <span className="projectDateLabel">End</span>{" "}
                <span className="projectDateValue">{formatDateShort(p.end_date)}</span>
              </div>
            </div>

            <div className="projectActions">
              <button
                type="button"
                className="ctaButton ctaButton--alt"
                onClick={() => openBoard(p.id)}
              >
                Open board
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
