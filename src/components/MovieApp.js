import React, { useEffect, useState, useCallback } from 'react';
import './MovieApp.css';
import axios from 'axios';

const API_URL = process.env.REACT_APP_OMDB_API_URL;
const API_KEY = process.env.REACT_APP_OMDB_API_KEY;

function MovieApp() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('title.asc');
  const [genres] = useState([
    { id: 'action', name: 'Action' },
    { id: 'comedy', name: 'Comedy' },
    { id: 'drama', name: 'Drama' },
    { id: 'horror', name: 'Horror' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMovies = useCallback(async () => {
    if (!searchQuery) return;

    setLoading(true);
    setError('');

    try {
      const { data } = await axios.get(API_URL, {
        params: { apikey: API_KEY, s: searchQuery },
      });

      if (data.Response === 'False') {
        setMovies([]);
        setError(data.Error);
        return;
      }

      let movieResults = data.Search || [];

      const detailedMovies = await Promise.all(
        movieResults.map(async (movie) => {
          const detailsResponse = await axios.get(API_URL, {
            params: { apikey: API_KEY, i: movie.imdbID },
          });

          return {
            ...movie,
            rating: detailsResponse.data.imdbRating || 'N/A',
            plot: detailsResponse.data.Plot || 'No description available.',
          };
        })
      );

      const sortedMovies = [...detailedMovies].sort((a, b) => {
        switch (sortBy) {
          case 'title.asc':
            return a.Title.localeCompare(b.Title);
          case 'title.desc':
            return b.Title.localeCompare(a.Title);
          case 'year.asc':
            return parseInt(a.Year) - parseInt(b.Year);
          case 'year.desc':
            return parseInt(b.Year) - parseInt(a.Year);
          default:
            return 0;
        }
      });

      setMovies(sortedMovies);
    } catch (err) {
      setError('Failed to fetch movies. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return (
    <div>
      <h1>MovieHub</h1>
      <div className='search-bar'>
        <input
          type='text'
          placeholder='Enter Movie Name'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='search-input'
        />
        <button onClick={fetchMovies} className='search-button'>
          <i className="bi bi-search"></i>
        </button>
      </div>

      <div className='filters'>
        <label htmlFor='sort-by'>Sort By:</label>
        <select id='sort-by' value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value='title.asc'>Title (A-Z)</option>
          <option value='title.desc'>Title (Z-A)</option>
          <option value='year.asc'>Year (Oldest First)</option>
          <option value='year.desc'>Year (Newest First)</option>
        </select>

        <label htmlFor='genre'>Genre</label>
        <select id='genre' value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
          <option value=''>All Genres</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <div className="movie-list">
        {movies.length > 0 ? (
          movies.map((movie) => (
            <div key={movie.imdbID} className="movie-card">
              <img src={movie.Poster} alt={movie.Title} />
              <h3>{movie.Title}</h3>
              <p><strong>Year:</strong> {movie.Year}</p>
              <p><strong>Rating:</strong> ⭐ {movie.rating}</p>
              <p className="movie-plot"><strong>About:</strong> {movie.plot}</p>
            </div>
          ))
        ) : (
          !loading && <p>No movies found</p>
        )}
      </div>
    </div>
  );
}

export default MovieApp;
