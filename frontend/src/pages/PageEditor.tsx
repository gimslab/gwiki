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
  const isEditing = !!pageName;

  useEffect(() => {
    if (isEditing) {
      const fetchPage = async () => {
        try {
          const token = localStorage.getItem('gwiki-token');
          const response = await fetch(`/api/pages/${pageName}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Failed to fetch page');
          const data = await response.text();
          setContent(data);
        } catch (err) {
          setError(getErrorMessage(err));
        }
      };
      fetchPage();
    }
  }, [isEditing, pageName]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const token = localStorage.getItem('gwiki-token');
    const url = isEditing ? `/api/pages/${pageName}` : `/api/pages`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pageName: title, content }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save page');
      }
      onPageUpdate(); // Refresh the page list
      navigate(`/pages/${title}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="page-editor">
      <h2>{isEditing ? `Edit ${pageName}` : 'Create New Page'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isEditing}
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
