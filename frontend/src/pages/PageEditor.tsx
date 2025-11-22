import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PageEditor.css';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

interface PageEditorProps {
  onPageUpdate: () => void;
}

const PageEditor: React.FC<PageEditorProps> = ({ onPageUpdate }) => {
  const { pageName } = useParams<{ pageName?: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState(pageName || '');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isNewPage, setIsNewPage] = useState(!pageName);

  useEffect(() => {
    if (pageName) {
      const fetchPage = async () => {
        try {
          const token = localStorage.getItem('gwiki-token');
          const response = await fetch(`/api/pages/${pageName}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.status === 404) {
            setIsNewPage(true);
            setContent(''); // Ensure content is empty for a new page
          } else if (!response.ok) {
            throw new Error('Failed to fetch page');
          } else {
            const data = await response.text();
            setContent(data);
            setIsNewPage(false);
          }
        } catch (err) {
          setError(getErrorMessage(err));
        }
      };
      fetchPage();
    }
  }, [pageName]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const token = localStorage.getItem('gwiki-token');
    // For new pages, the title might be edited, so the final pageName is `title`.
    const finalPageName = isNewPage ? title : pageName;
    const url = isNewPage ? `/api/pages` : `/api/pages/${pageName}`;
    const method = isNewPage ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pageName: finalPageName, content }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save page');
      }
      onPageUpdate(); // Refresh the page list
      navigate(`/pages/${finalPageName}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="page-editor">
      <h2>{isNewPage ? 'Create New Page' : `Edit ${pageName}`}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={!isNewPage} // Disable title editing if it's an existing page
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">Content (Markdown)</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={(e) => {
              if (e.target.value !== content) {
                console.log('Syncing external change to state on blur...');
                setContent(e.target.value);
              }
            }}
            rows={20}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="save-button">
          Save Page
        </button>
      </form>
    </div>
  );
};

export default PageEditor;
