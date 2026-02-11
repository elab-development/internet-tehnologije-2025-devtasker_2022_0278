import { useCallback, useState } from "react";
import axios from "axios";

const YT_BASE = "https://www.googleapis.com/youtube/v3/search";

const getApiKey = () => {
  return process.env.REACT_APP_YOUTUBE_API_KEY || "";
};

export default function Youtube() {
  const [query, setQuery] = useState("react laravel testing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [videos, setVideos] = useState([]);

  const fetchVideos = useCallback(async () => {
    const q = query.trim();
    const key = getApiKey();

    if (!key) {
      setError("Nedostaje YouTube API ključ u .env fajlu.");
      return;
    }

    if (!q) {
      setError("Unesi tagove ili ključne reči (npr. react laravel testing).");
      return;
    }

    try {
      setError("");
      setLoading(true);
      setVideos([]);

      const res = await axios.get(YT_BASE, {
        params: {
          part: "snippet",
          q,
          type: "video",
          maxResults: 8,
          safeSearch: "moderate",
          key,
        },
        headers: { Accept: "application/json" },
      });

      const items = res.data?.items ?? [];

      const mapped = items
        .map((it) => {
          const videoId = it?.id?.videoId;
          const sn = it?.snippet;

          if (!videoId || !sn) return null;

          return {
            video_id: videoId,
            title: sn.title ?? "",
            description: sn.description ?? "",
            channel_title: sn.channelTitle ?? "",
            thumbnail:
              sn?.thumbnails?.medium?.url ||
              sn?.thumbnails?.default?.url ||
              "",
            url: `https://www.youtube.com/watch?v=${videoId}`,
          };
        })
        .filter(Boolean);

      setVideos(mapped);

      if (mapped.length === 0) {
        setError("Nema rezultata. Probaj druge tagove.");
      }
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403) {
        setError("YouTube API je odbio zahtev (kvota ili restrikcija ključa).");
      } else {
        setError("Greška pri učitavanju YouTube preporuka.");
      }
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="ytPage">
      <h1 className="ytTitle">YouTube preporuke za developera</h1>

      <p className="ytSubtitle">
        Unesi tagove (npr. <b>react</b>, <b>laravel</b>, <b>testing</b>) i dobićeš edukativne klipove.
      </p>

      {error ? <div className="ytAlert">{error}</div> : null}

      <div className="ytControls">
        <input
          className="ytInput"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="npr. react laravel testing"
        />

        <button
          className="ytButton"
          type="button"
          onClick={fetchVideos}
          disabled={loading}
        >
          {loading ? "Tražim..." : "Pretraži"}
        </button>
      </div>

      {loading ? <div className="ytLoading">Učitavanje preporuka...</div> : null}

      {!loading && videos.length > 0 ? (
        <div className="ytGrid">
          {videos.map((v) => (
            <a
              key={v.video_id}
              className="ytCard"
              href={v.url}
              target="_blank"
              rel="noreferrer"
            >
              {v.thumbnail ? (
                <img className="ytThumb" src={v.thumbnail} alt={v.title} />
              ) : (
                <div className="ytThumb ytThumb--empty">No image</div>
              )}

              <div className="ytCardBody">
                <div className="ytCardTitle">{v.title}</div>
                <div className="ytCardChannel">{v.channel_title}</div>
                <div className="ytCardDesc">
                  {(v.description || "").slice(0, 140)}
                  {v.description && v.description.length > 140 ? "..." : ""}
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
