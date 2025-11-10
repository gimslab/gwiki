import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import './PageViewer.css';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const PageViewer: React.FC = () => {
  const { pageName } = useParams<{ pageName: string }>();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const token = localStorage.getItem('gwiki-token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`/api/pages/${pageName}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          navigate('/login');
          return;
        }

        if (response.status === 404) {
          setError('Page not found');
          setContent('');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch page');
        }

        const data = await response.text();
        setContent(data);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };

    fetchPage();
  }, [pageName, navigate]);

  const getMarkdownText = () => {
    const rawMarkup = marked(content);
    return { __html: rawMarkup };
  };

  return (
    <div className="page-viewer">
      {error ? (
        <h2>{error}</h2>
      ) : (
        <>
          <div className="page-header">
            <h2>{pageName}</h2>
            <Link to={`/edit/${pageName}`} className="edit-page-button">
              Edit Page
            </Link>
          </div>
          <div className="page-content" dangerouslySetInnerHTML={getMarkdownText()} />
        </>
      )}
    </div>
  );
};

export default PageViewer;
