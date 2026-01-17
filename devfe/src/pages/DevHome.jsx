import useProgrammingJoke from "../hooks/useProgrammingJoke";

export default function DevHome() {
  const { loading, joke, error, fetchJoke } = useProgrammingJoke(true);

  return (
    <div className="home devHome">
      <div className="home__content devHome__content">
        <div className="home__text">
          <h1>Developer</h1>
          <p>
            Dev Home nudi brz pregled i mali break uz programming joke, za lep početak radnog dana.
          </p>

          <div className="devJokeCard">
            <div className="devJokeHead">
              <h2>Programming joke</h2>
              <button
                className="ctaButton ctaButton--alt"
                type="button"
                onClick={fetchJoke}
                disabled={loading}
              >
                {loading ? "Loading" : "New joke"}
              </button>
            </div>

            {error ? <div className="form-error">{error}</div> : null}

            {!error && !joke && loading ? <p>Loading</p> : null}

            {!error && joke ? (
              <div className="devJokeBody">
                <p className="devJokeSetup">{joke.setup}</p>
                <p className="devJokePunchline">{joke.punchline}</p>
              </div>
            ) : null}
          </div>

          <div className="home__actions">
            <button className="ctaButton" type="button">
              My tasks
            </button>
            <button className="ctaButton ctaButton--alt" type="button">
              Open last task
            </button>
          </div>
        </div>

        <div className="devHome__images">
          <img className="devHome__img" src="/slika1.png" alt="slika 1" />
          <img className="devHome__img" src="/slika2.png" alt="slika 2" />
        </div>
      </div>
    </div>
  );
}
