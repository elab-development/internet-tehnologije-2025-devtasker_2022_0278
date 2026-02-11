import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API_BASE = "http://127.0.0.1:8000/api";

const statusLabel = (key) => {
  const map = {
    created: "Created",
    started: "Started",
    in_progress: "In progress",
    done: "Done",
  };
  return map[key] ?? key;
};

const priorityLabel = (key) => {
  const map = { low: "Low", medium: "Medium", high: "High" };
  return map[key] ?? key;
};

const PIE_COLORS = ["#4E79A7", "#F28E2B", "#E15759", "#59A14F"];

function getAuthHeaders() {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

function MessageBox({ type = "error", children }) {
  const style =
    type === "error"
      ? {
          background: "rgba(255, 0, 0, 0.10)",
          border: "1px solid rgba(255, 0, 0, 0.25)",
          color: "#1d2b3a",
          borderRadius: 14,
          padding: "12px 14px",
          fontWeight: 800,
          marginBottom: 14,
        }
      : {
          background: "rgba(66, 129, 164, 0.12)",
          border: "1px solid rgba(66, 129, 164, 0.25)",
          color: "#1d2b3a",
          borderRadius: 14,
          padding: "12px 14px",
          fontWeight: 800,
          marginBottom: 14,
        };

  return <div style={style}>{children}</div>;
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.65)",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 6px 16px rgba(0,0,0,0.10)",
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 900, color: "#2b5c77" }}>
        {value ?? 0}
      </div>
      <div style={{ fontWeight: 800, color: "#333" }}>{label}</div>
    </div>
  );
}

function ChartsSection({ charts }) {
  const statusData = (charts?.status_pie ?? [])
    .map((x) => ({
      name: statusLabel(x.key),
      value: Number(x.value ?? 0),
    }))
    .filter((x) => x.value > 0);

  const priorityData = (charts?.priority_bar ?? []).map((x) => ({
    name: priorityLabel(x.key),
    value: Number(x.value ?? 0),
  }));

  const devData = (charts?.developer_load ?? []).map((row) => ({
    name: row?.developer?.name ?? row?.developer?.email ?? "Nepoznato",
    value: Number(row?.open_tasks ?? 0),
  }));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 18,
        marginTop: 18,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 6px 16px rgba(0,0,0,0.10)",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 10 }}>Status breakdown</h2>

        {!statusData.length ? (
          <div
            style={{
              background: "rgba(0,0,0,0.05)",
              borderRadius: 14,
              padding: 14,
              fontWeight: 800,
            }}
          >
            Nema podataka za pie chart.
          </div>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={105}
                  label
                >
                  {statusData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 6px 16px rgba(0,0,0,0.10)",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 10 }}>Priority breakdown</h2>

        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#2b5c77"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 6px 16px rgba(0,0,0,0.10)",
          gridColumn: "1 / -1",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 10 }}>
          Open taskovi po developeru
        </h2>

        {!devData.length ? (
          <div
            style={{
              background: "rgba(186, 100, 100, 0.05)",
              borderRadius: 14,
              padding: 14,
              fontWeight: 800,
            }}
          >
            Nema open taskova po developerima.
          </div>
        ) : (
          <div style={{ width: "100%", height: 360 }}>
            <ResponsiveContainer>
              <BarChart data={devData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={180} />
                <Tooltip />
                <Bar dataKey="value" fill="#5b97b7"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .metrics-responsive-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default function ProjectMetrics() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      setError("");
      setLoadingProjects(true);

      const res = await axios.get(`${API_BASE}/projects`, {
        headers: {
          Accept: "application/json",
          ...getAuthHeaders(),
        },
      });

      const list = Array.isArray(res.data) ? res.data : res.data?.data;

      if (!Array.isArray(list)) {
        setProjects([]);
        setError("Ne mogu da učitam projekte. Proveri format odgovora.");
        return;
      }

      setProjects(list);

      if (list.length && !selectedProjectId) {
        setSelectedProjectId(String(list[0].id));
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 401
          ? "Niste autorizovani. Potrebna je prijava."
          : "Greška pri učitavanju projekata.");
      setError(msg);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [selectedProjectId]);

  const fetchMetrics = useCallback(async (projectId) => {
    if (!projectId) return;

    try {
      setError("");
      setLoadingMetrics(true);
      setMetrics(null);

      const res = await axios.get(
        `${API_BASE}/projects/${projectId}/metrics`,
        {
          headers: {
            Accept: "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (!res.data?.success) {
        setError(res.data?.message || "Neuspešno učitavanje metrika.");
        return;
      }

      setMetrics(res.data?.data ?? null);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 403
          ? "Nemate dozvolu za metrike ili niste član projekta."
          : e?.response?.status === 401
          ? "Niste autorizovani. Potrebna je prijava."
          : "Greška pri učitavanju metrika.");
      setError(msg);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (!selectedProjectId) return;
    fetchMetrics(selectedProjectId);
  }, [selectedProjectId, fetchMetrics]);

  const selectedProject = useMemo(() => {
    const id = Number(selectedProjectId);
    return projects.find((p) => Number(p.id) === id) ?? null;
  }, [projects, selectedProjectId]);

  const cards = metrics?.cards ?? null;
  const charts = metrics?.charts ?? null;

  return (
    <div style={{ padding: 22 }}>
      <h1 style={{ fontSize: 44, margin: 0, color: "#2b5c77" }}>
        Project Metrics
      </h1>

      <p style={{ marginTop: 10, fontSize: 18, color: "#222" }}>
        Izaberi projekat, pa vidi overview taskova (cards) i breakdown po statusu,
        prioritetu i developerima.
      </p>

      {error ? <MessageBox type="error">{error}</MessageBox> : null}

      <div
        style={{
          background: "rgba(186, 103, 103, 0.1)",
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div >
            Projekat
          </div>
          <div style={{ fontWeight: 800, color: "#d67070" }}>
            {selectedProject
              ? `${selectedProject.name ?? selectedProject.title ?? "Bez naziva"}`
              : "Nije izabran"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={loadingProjects}
            style={{
              minWidth: 280,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(91, 62, 62, 0.2)",
              fontWeight: 800,
            }}
          >
            <option value="" disabled>
              {loadingProjects ? "Učitavam projekte..." : "Izaberi projekat"}
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name ?? p.title ?? `Project #${p.id}`}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchMetrics(selectedProjectId)}
            disabled={!selectedProjectId || loadingMetrics}
            type="button"
            style={{
              padding: "10px 16px",
              borderRadius: 14,
              border: "none",
              fontWeight: 900,
              cursor: loadingMetrics ? "not-allowed" : "pointer",
              background: "#2b5c77",
              color: "#fff",
              minWidth: 180,
            }}
          >
            {loadingMetrics ? "Učitavam..." : "Osveži metrike"}
          </button>
        </div>
      </div>

      {!selectedProjectId ? (
        <div
          style={{
            marginTop: 18,
            background: "rgba(255, 255, 255, 0.6)",
            borderRadius: 18,
            padding: 18,
            border: "1px solid rgba(0,0,0,0.10)",
            fontWeight: 800,
          }}
        >
          Izaberi projekat da bi se prikazale metrike.
        </div>
      ) : null}

      {loadingMetrics ? (
        <div
          style={{
            marginTop: 18,
            background: "rgba(255, 255, 255, 0.6)",
            borderRadius: 18,
            padding: 18,
            border: "1px solid rgba(0,0,0,0.10)",
            fontWeight: 800,
          }}
        >
          Učitavanje metrika...
        </div>
      ) : null}

      {cards && !loadingMetrics ? (
        <div style={{ marginTop: 18 }}>
          <h2 style={{ margin: 0, marginBottom: 12 }}>Overview</h2>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <StatCard label="Ukupno taskova" value={cards.total_tasks} />
            <StatCard label="Open taskovi" value={cards.open_tasks} />
            <StatCard label="Done taskovi" value={cards.done_tasks} />
            <StatCard label="Overdue" value={cards.overdue} />
            <StatCard label="Due soon (7 dana)" value={cards.due_soon_7d} />
          </div>
        </div>
      ) : null}

      {charts && !loadingMetrics ? <ChartsSection charts={charts} /> : null}
    </div>
  );
}
