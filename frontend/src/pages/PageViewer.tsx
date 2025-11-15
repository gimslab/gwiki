import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import './PageViewer.css';

import { parseMoniwiki } from '../utils/moniwiki-parser';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

interface PageViewerProps {
  onPageUpdate: () => void;
}

const PageViewer: React.FC<PageViewerProps> = ({ onPageUpdate }) => {
  const { pageFileName } = useParams<{ pageFileName: string }>();
  const pageName = pageFileName ? pageFileName.split('.').slice(0, -1).join('.') : '';
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

        const response = await fetch(`/api/pages/${pageFileName}`, {
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
  }, [pageFileName, navigate]);

  const getRenderedContent = () => {
    console.log('Rendering content for:', pageFileName);
    console.log('Raw content:', content);

    let rawMarkup;
    if (pageFileName?.endsWith('.moniwiki')) {
      console.log('Using Moniwiki parser.');
      rawMarkup = parseMoniwiki(content);
    } else {
      console.log('Using Markdown parser.');
      rawMarkup = marked(content);
    }
    
    console.log('Generated markup:', rawMarkup);
    return { __html: rawMarkup };
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${pageName}"?`)) {
      try {
        const token = localStorage.getItem('gwiki-token');
        const response = await fetch(`/api/pages/${pageFileName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to delete page');
        }

        onPageUpdate(); // Refresh the page list
        navigate('/'); // Navigate to home page after successful deletion
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
  };

  return (
    <div className="page-viewer">
      {error ? (
        <h2>{error}</h2>
      ) : (
        <>
          <div className="page-header">
            <h2>{pageName}</h2>
            <div className="page-actions">
              <Link to={`/edit/${pageFileName}`} className="edit-page-button">
                Edit Page
              </Link>
              <button onClick={handleDelete} className="delete-page-button">
                Delete Page
              </button>
            </div>
          </div>
          <div className="page-content" dangerouslySetInnerHTML={getRenderedContent()} />
        </>
      )}
    </div>
  );
};

export default PageViewer;
