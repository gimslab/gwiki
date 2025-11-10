import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import PageViewer from './pages/PageViewer';
import LoginPage from './pages/LoginPage';
import PageEditor from './pages/PageEditor';
import GitPage from './pages/GitPage';
import SearchPage from './pages/SearchPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('gwiki-token'));
  const [pages, setPages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('gwiki-token');
      setIsAuthenticated(!!token);
      if (!token) {
        setPages([]); // Clear pages on logout
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchPages = async () => {
        try {
          const token = localStorage.getItem('gwiki-token');
          const response = await fetch('/api/pages', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.status === 401 || response.status === 403) {
            handleLogout();
            return;
          }
          if (!response.ok) {
            throw new Error('Failed to fetch pages');
          }
          const data = await response.json();
          setPages(data);
        } catch (error) {
          console.error(error);
        }
      };
      fetchPages();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('gwiki-token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery.trim()}`);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1><Link to="/">gwiki</Link></h1>
        {isAuthenticated && (
          <>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </>
        )}
      </header>
      <aside className="sidebar">
        <h2>Pages</h2>
        {isAuthenticated && (
          <>
            <Link to="/new-page" className="new-page-button">New Page</Link>
            <Link to="/git" className="git-page-button">Git Status</Link>
            <ul>
              {pages.map((page) => (
                <li key={page}>
                  <Link to={`/pages/${page}`}>{page}</Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pages/:pageName" element={<PageViewer />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/new-page" element={<PageEditor />} />
          <Route path="/edit/:pageName" element={<PageEditor />} />
          <Route path="/git" element={<GitPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
