import { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function Tags() {
  const API_BASE = "http://127.0.0.1:8000/api";

  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");
  const canAccess = role === "taskadmin";

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

  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");

  const [newName, setNewName] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

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

  const fetchTags = async () => {
    try {
      setPageError("");
      setLoading(true);

      const res = await axiosClient.get("/tags");
      const rows = res?.data?.data || [];
      setTags(rows);
    } catch (err) {
      setPageError(parseApiError(err));
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    if (!canAccess) return;
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canAccess]);

  const onCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setPageError("");

    const name = newName.trim();
    if (!name) {
      setFormError("Unesi naziv taga.");
      return;
    }

    try {
      await axiosClient.post("/tags", { name });
      setNewName("");
      await fetchTags();
    } catch (err) {
      setFormError(parseApiError(err));
    }
  };

  const startEdit = (tag) => {
    setPageError("");
    setFormError("");
    setEditingId(tag.id);
    setEditName(tag.name || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const onSaveEdit = async (tagId) => {
    setPageError("");

    const name = editName.trim();
    if (!name) {
      setPageError("Naziv taga ne može biti prazan.");
      return;
    }

    try {
      await axiosClient.put(`/tags/${tagId}`, { name });
      cancelEdit();
      await fetchTags();
    } catch (err) {
      setPageError(parseApiError(err));
    }
  };

  const onDelete = async (tagId) => {
    setPageError("");
    const ok = window.confirm("Da li si sigurna da želiš da obrišeš ovaj tag?");
    if (!ok) return;

    try {
      await axiosClient.delete(`/tags/${tagId}`);
      await fetchTags();
    } catch (err) {
      setPageError(parseApiError(err));
    }
  };

  if (!token) {
    return (
      <div className="mainContent">
        <h1>Tags</h1>
        <p>Moraš biti ulogovana da bi pristupila ovoj stranici.</p>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="mainContent">
        <h1>Tags</h1>
        <p>Nemaš dozvolu. Samo Task Admin može da upravlja tagovima.</p>
      </div>
    );
  }

  return (
    <div className="tagsPage">
      <div className="tagsHeader">
        <div>
          <h1>Tags</h1>
          <p className="tagsSubtitle">
            Tagovi se koriste za kategorizaciju taskova (npr. Bug, Feature, Backend).
            Ovde možeš da ih dodaš, preimenuješ ili obrišeš.
          </p>
        </div>
      </div>

      {pageError ? <div className="tagsMessage tagsMessage--error">{pageError}</div> : null}

      <div className="tagsLayout">
        {/* Create */}
        <div className="tagsCard">
          <h2>Forma: Novi tag</h2>
          <p className="tagsHelp">
            Dodaj novi tag koji će biti dostupan na taskovima
          </p>

          <form className="form" onSubmit={onCreate}>
            <div className="form-group">
              <label>Naziv taga</label>
              <input
                className="form-control"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="npr. Bug"
              />
              {formError ? <div className="form-error">{formError}</div> : null}
            </div>

            <button className="ctaButton" type="submit">
              Add tag
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="tagsCard">
          <div className="tagsTableTop">
            <div>
              <h2>Svi tagovi</h2>
            </div>

            {loading ? <div className="tagsLoading">Loading...</div> : null}
          </div>

          <div className="tagsTableWrap">
            <table className="tagsTable">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>ID.</th>
                  <th>Naziv</th>
                  <th style={{ width: 260, textAlign: "right" }}>Akcije</th>
                </tr>
              </thead>

              <tbody>
                {!loading && tags.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="tagsEmpty">
                      Nema tagova
                    </td>
                  </tr>
                ) : null}

                {tags.map((t) => {
                  const isEditing = editingId === t.id;

                  return (
                    <tr key={t.id}>
                      <td className="tagsMono">{t.id}</td>

                      <td>
                        {!isEditing ? (
                          <div className="tagsName">{t.name}</div>
                        ) : (
                          <input
                            className="form-control tagsInlineInput"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                          />
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        {!isEditing ? (
                          <div className="tagsActions">
                            <button
                              type="button"
                              className="ctaButton ctaButton--alt"
                              onClick={() => startEdit(t)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="ctaButton tagsDangerBtn"
                              onClick={() => onDelete(t.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div className="tagsActions">
                            <button
                              type="button"
                              className="ctaButton"
                              onClick={() => onSaveEdit(t.id)}
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
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="tagsFootNote">
            Tip: Klikni “Edit” da preimenuješ tag
          </p>
        </div>
      </div>
    </div>
  );
}
