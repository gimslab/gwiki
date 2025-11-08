import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import PageViewer from './pages/PageViewer';
import LoginPage from './pages/LoginPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('gwiki-token'));
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('gwiki-token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('gwiki-token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="header">
        <h1><Link to="/">gwiki</Link></h1>
        {isAuthenticated && (
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        )}
      </header>
      <aside className="sidebar">
        <h2>Pages</h2>
        {/* Page list will go here */}
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pages/:pageName" element={<PageViewer />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
