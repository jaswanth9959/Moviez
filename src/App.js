import { useState, useEffect } from "react";
import StarComponent from "./StarComponent";

const average = (arr) =>
  arr?.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
const key = "";
export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState(function () {
    const res = localStorage.getItem("watched");
    return JSON.parse(res);
  });
  const [loading, setLoading] = useState(false);
  const [selectedID, setSelectedID] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchdata = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${key}&s=${query}`
        );

        const data = await res.json();
        if (data.Response === "False") {
          throw new Error("Movie not found");
        }
        setMovies(data.Search);
        setLoading(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (query.length < 3) {
      setMovies([]);
      setError("");
      setLoading(false);
      return;
    }
    fetchdata();
  }, [query]);
  // fetch(`http://www.omdbapi.com/?apikey=${key}&s=inception`)
  //   .then((res) => res.json())
  //   .then((data) => console.log(data));

  const handleSelect = (id) => {
    setSelectedID((i) => (i === id ? null : id));
  };
  const handleAddWatched = (newMovie) => {
    setWatched([...watched, newMovie]);
    setSelectedID(null);
  };

  const handleRemoveWatched = (id) => {
    setWatched(watched.filter((movie) => movie.imdbID !== id));
  };

  useEffect(
    function () {
      localStorage.setItem("watched", JSON.stringify(watched));
    },
    [watched]
  );
  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <NumResult movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {loading && <Loading />}
          {!loading && !error && (
            <MovieList movies={movies} handleSelect={handleSelect} />
          )}
          {error && <div className="error">⛔ {error}</div>}
        </Box>
        <Box>
          {selectedID ? (
            <MovieDetails
              selectedID={selectedID}
              setSelectedID={setSelectedID}
              handleAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <Stats watched={watched} />
              <WatchedList
                watched={watched}
                handleRemoveWatched={handleRemoveWatched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

const Loading = () => {
  return <p className="loader">Loading.....</p>;
};
const NavBar = ({ children }) => {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
};

const Logo = () => {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>Moviez</h1>
    </div>
  );
};

const Search = ({ query, setQuery }) => {
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
};

const NumResult = ({ movies }) => {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
};

const Main = ({ children }) => {
  return <main className="main">{children}</main>;
};

const Box = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && <>{children}</>}
    </div>
  );
};

const MovieList = ({ movies, handleSelect }) => {
  return (
    <ul className="list">
      {movies?.map((movie) => (
        <Movie key={movie.imdbID} movie={movie} handleSelect={handleSelect} />
      ))}
    </ul>
  );
};

const Movie = ({ movie, handleSelect }) => {
  return (
    <li onClick={() => handleSelect(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
};

const MovieDetails = ({
  selectedID,
  setSelectedID,
  handleAddWatched,
  watched,
}) => {
  const [movie, setMovie] = useState({});
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState("");
  const {
    Title,
    Year,
    Poster,
    Actors,
    Genre,
    imdbRating,
    Runtime,
    Director,
    Plot,
  } = movie;

  const isWatched = watched?.map((movie) => movie.imdbID).includes(selectedID);

  const newMovie = {
    Title,
    Poster,
    runtime: Number(Runtime?.split(" ")[0]),
    imdbID: selectedID,
    imdbRating,
    userRating,
  };
  const rating = watched?.filter((movie) => movie.imdbID === selectedID)[0];

  useEffect(() => {
    if (!Title) return;
    document.title = `Movie | ${Title}`;
    return () => {
      document.title = "UsePopCorn";
    };
  }, [Title]);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const res = await fetch(
        `http://www.omdbapi.com/?apikey=${key}&i=${selectedID}`
      );

      const data = await res.json();
      setMovie(data);
      setLoading(false);
    };
    fetchDetails();
  }, [selectedID]);

  return (
    <div className="details">
      {loading ? (
        <Loading />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={() => setSelectedID(null)}>
              &larr;
            </button>
            <img src={Poster} alt="img" />
            <section className="details-overview">
              <h2>{Title}</h2>
              <p>
                {Year} &bull; {Runtime} &bull; {Genre}
              </p>
              <p>⭐ {imdbRating} IMDb Rating</p>
            </section>
          </header>
          <section>
            <div className="rating">
              {isWatched ? (
                <p>
                  {" "}
                  you have already rated this movie with {rating?.userRating}⭐
                </p>
              ) : (
                <>
                  <StarComponent maxStars={10} onsetRating={setUserRating} />
                  <button
                    className="btn-add"
                    onClick={() => handleAddWatched(newMovie)}
                  >
                    + Add to watched list
                  </button>
                </>
              )}
            </div>
            <p>
              <em>{Plot}</em>
            </p>
            <p>
              <strong>Starring:</strong> {Actors}
            </p>
            <p>
              <strong>Directed By:</strong>
              {Director}
            </p>
          </section>
        </>
      )}
    </div>
  );
};
const Stats = ({ watched }) => {
  const avgImdbRating = average(watched?.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched?.map((movie) => movie.userRating));
  const avgRuntime = average(watched?.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched?.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
};

const WatchedList = ({ watched, handleRemoveWatched }) => {
  return (
    <ul className="list">
      {watched?.map((movie) => (
        <WatchedMovie
          key={movie.imdbID}
          movie={movie}
          handleRemoveWatched={handleRemoveWatched}
        />
      ))}
    </ul>
  );
};
const WatchedMovie = ({ movie, handleRemoveWatched }) => {
  return (
    <li>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => {
            handleRemoveWatched(movie.imdbID);
          }}
        >
          X
        </button>
      </div>
    </li>
  );
};
