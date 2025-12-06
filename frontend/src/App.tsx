import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import PageViewer from './pages/PageViewer';
import LoginPage from './pages/LoginPage';
import PageEditor from './pages/PageEditor';
import GitPage from './pages/GitPage';
import SearchPage from './pages/SearchPage';
import GitStatusIndicator from './components/GitStatusIndicator';
import TitleIndexPage from './pages/TitleIndexPage';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { defaultShortcuts } from './config/shortcuts';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('gwiki-token'));
  const [pages, setPages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [changedFilesCount, setChangedFilesCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcut(defaultShortcuts.newPage, () => {
    if (isAuthenticated) {
      navigate('/new-page');
    }
  });

  useKeyboardShortcut(defaultShortcuts.focusSearch, () => {
    if (isAuthenticated && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  });

  useKeyboardShortcut(defaultShortcuts.goHome, () => {
    if (isAuthenticated) {
      navigate('/');
    }
  });

  const fetchGitStatus = async () => {
    try {
      const token = localStorage.getItem('gwiki-token');
      if (!token) return;

      const response = await fetch('/api/git/status-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChangedFilesCount(data.changedFilesCount);
      }
    } catch (error) {
      console.error('Error fetching git status summary:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchGitStatus();
      const interval = setInterval(fetchGitStatus, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchPages();
    }
  }, [isAuthenticated]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        if (mainRef.current) {
          mainRef.current.scrollTop = 0;
        }
      });
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('gwiki-token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handlePageUpdate = () => {
    fetchPages();
    fetchGitStatus();
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
                ref={searchInputRef}
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="header-right-items">
              <GitStatusIndicator changedFilesCount={changedFilesCount} />
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </>
        )}
      </header>
      <aside className="sidebar">
        <h2>Pages</h2>
        {isAuthenticated && (
          <>
            <div className="sidebar-actions">
              <Link to="/new-page" className="new-page-button">New Page</Link>
              <Link to="/git" className="git-page-button">Git Status</Link>
              <Link to="/title-index" className="title-index-button">Title Index</Link>
            </div>
            <ul>
              {pages.map((page) => (
                <li key={page}>
                  <Link
                    to={`/pages/${encodeURIComponent(page)}`}
                    className={page.endsWith('.moniwiki') ? 'moniwiki-file-link' : ''}
                  >
                    {page}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
      <main className="main" ref={mainRef}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pages/:pageFileName" element={<PageViewer onPageUpdate={handlePageUpdate} />} />
          <Route path="/login" element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="/new-page" element={<PageEditor onPageUpdate={handlePageUpdate} />} />
          <Route path="/edit/:pageName" element={<PageEditor onPageUpdate={handlePageUpdate} />} />
          <Route path="/git" element={<GitPage onCommit={fetchGitStatus} />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/title-index" element={<TitleIndexPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
