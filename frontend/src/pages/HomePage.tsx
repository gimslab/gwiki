import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem('gwiki-token');

  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h2>Welcome to gwiki</h2>
      {isAuthenticated ? (
        <p>Select a page from the sidebar to get started.</p>
      ) : (
        <>
          <p>Please log in to manage your wiki pages.</p>
          <Link to="/login" className="login-button-home">
            Go to Login
          </Link>
        </>
      )}
    </div>
  );
};

export default HomePage;
