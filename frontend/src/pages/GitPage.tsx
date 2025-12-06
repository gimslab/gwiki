import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './GitPage.css';

interface GitStatus {
  files: { path: string; working_dir: string }[];
  staged: string[];
  not_added: string[];
  created: string[];
  deleted: string[];
  modified: string[];
  renamed: { from: string; to: string }[];
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

interface GitPageProps {
  onCommit: () => void;
}

const GitPage: React.FC<GitPageProps> = ({ onCommit }) => {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffContent, setDiffContent] = useState<string | null>(null);
  const navigate = useNavigate();
  const diffSectionRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('gwiki-token');
      const response = await fetch('/api/git/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) navigate('/login');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch git status');
      }
      const data = await response.json();
      setStatus(data);
      // Clear selected file if it's no longer in the list
      if (selectedFile) {
        const fileStillExists = data.files.some((f: any) => f.path === selectedFile);
        if (!fileStillExists) {
          setSelectedFile(null);
          setDiffContent(null);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const fetchDiff = async (file: string) => {
    try {
      const token = localStorage.getItem('gwiki-token');
      const response = await fetch(`/api/git/diff?file=${encodeURIComponent(file)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch git diff');
      }
      const data = await response.json();
      setDiffContent(data.diff);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleFileClick = (file: string) => {
    if (selectedFile === file) {
      setSelectedFile(null);
      setDiffContent(null);
    } else {
      setSelectedFile(file);
      fetchDiff(file);
      // Scroll to diff section after content loads
      setTimeout(() => {
        diffSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleRollback = async () => {
    if (!selectedFile || !confirm(`Are you sure you want to discard changes in ${selectedFile}? This cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('gwiki-token');
      const response = await fetch('/api/git/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ file: selectedFile }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to rollback file');
      }

      setSelectedFile(null);
      setDiffContent(null);
      fetchStatus();
      onCommit(); // Refresh header
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCommit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem('gwiki-token');
      const response = await fetch('/api/git/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: commitMessage }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to commit');
      }
      setCommitMessage('');
      fetchStatus(); // Refresh status on the page
      onCommit(); // Refresh status in the header
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const hasChanges = status ? status.files.length > 0 : false;

  return (
    <div className="git-page">
      <h2>Git Status</h2>
      {error && <p className="error-message">{error}</p>}
      {status && (
        <div className="status-section">
          <h3>Changed Files</h3>
          {status.files.length > 0 ? (
            <ul>
              {status.files.map((file) => (
                <li
                  key={file.path}
                  onClick={() => handleFileClick(file.path)}
                  style={{ fontWeight: selectedFile === file.path ? 'bold' : 'normal', borderLeft: selectedFile === file.path ? '5px solid var(--primary-color)' : '1px solid var(--border-color)' }}
                >
                  {file.path} ({file.working_dir})
                </li>
              ))}
            </ul>
          ) : (
            <p>No changes to commit.</p>
          )}
        </div>
      )}

      {selectedFile && diffContent && (
        <div className="diff-section" ref={diffSectionRef}>
          <h4>
            Diff: {selectedFile}
            <button className="rollback-btn" onClick={handleRollback}>Rollback Changes</button>
          </h4>
          <pre className="diff-content">{diffContent}</pre>
        </div>
      )}

      <div className="commit-section">
        <h3>Commit Changes</h3>
        <form onSubmit={handleCommit}>
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Enter commit message"
            rows={5}
            required
            disabled={!hasChanges}
          />
          <button type="submit" disabled={!hasChanges}>Commit</button>
        </form>
      </div>
    </div>
  );
};

export default GitPage;