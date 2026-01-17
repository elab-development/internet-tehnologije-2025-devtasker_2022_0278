import { useCallback, useEffect, useState } from "react";

export default function useProgrammingJoke(autoLoad = true) {
  const [loading, setLoading] = useState(false);
  const [joke, setJoke] = useState(null);
  const [error, setError] = useState("");

  const fetchJoke = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const res = await fetch(
        "https://official-joke-api.appspot.com/jokes/programming/random"
      );

      const data = await res.json();
      const first = Array.isArray(data) ? data[0] : null;

      if (!first?.setup || !first?.punchline) {
        setJoke(null);
        setError("Nema vica trenutno, probaj ponovo");
        return;
      }

      setJoke(first);
    } catch (e) {
      setJoke(null);
      setError("Greška pri učitavanju vica");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    fetchJoke();
  }, [autoLoad, fetchJoke]);

  return { loading, joke, error, fetchJoke };
}
