import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './SearchPage.css';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const SearchPage: React.FC = () => {

  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [filenameMatches, setFilenameMatches] = useState<string[]>([]);
  const [contentMatches, setContentMatches] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageExists, setPageExists] = useState(false);

  useEffect(() => {
    if (query) {
      setLoading(true);
      setPageExists(false);
      const fetchResults = async () => {
        try {
          const token = localStorage.getItem('gwiki-token');
          const response = await fetch(`/api/search?q=${query}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Search failed');
          const data = await response.json();
          const fetchedFilenameMatches = data.filenameMatches || [];
          setFilenameMatches(fetchedFilenameMatches);
          setContentMatches(data.contentMatches || []);

          const exactMatch = fetchedFilenameMatches.find((file: string) => file.toLowerCase() === `${query.toLowerCase()}.md`);
          setPageExists(!!exactMatch);

        } catch (err) {
          setError(getErrorMessage(err));
        } finally {
          setLoading(false);
        }
      };
      fetchResults();
    } else {
        setLoading(false);
    }
  }, [query]);

  return (
    <div className="search-page">
      <h2>Search Results for "{query}"</h2>

      {!loading && !pageExists && query && (
        <div className="create-new-page-link">
            <Link to={`/edit/${query}.md`}>Create New Page ({query}.md)</Link>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
      
      {loading ? (
        <p>Loading...</p>
      ) : filenameMatches.length === 0 && contentMatches.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <>
          {filenameMatches.length > 0 && (
            <div className="results-section">
              <h3>Filename Matches</h3>
              <ul>
                {filenameMatches.map((page) => (
                  <li key={page}>
                    <Link to={`/pages/${page}`}>{page}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {contentMatches.length > 0 && (
            <div className="results-section">
              <h3>Content Matches</h3>
              <ul>
                {contentMatches.map((page) => (
                  <li key={page}>
                    <Link to={`/pages/${page}`}>{page}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchPage;
