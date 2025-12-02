import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PageViewer.css';
import { convertMoniwikiToMarkdown } from '../utils/moniwiki-parser';
import ContentRenderer from '../components/ContentRenderer';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { defaultShortcuts } from '../config/shortcuts';

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
  const [notFoundFilenameMatches, setNotFoundFilenameMatches] = useState<string[]>([]);
  const [notFoundContentMatches, setNotFoundContentMatches] = useState<string[]>([]);
  const [conversionStatus, setConversionStatus] = useState<string | null>(null);
  const [correspondingFile, setCorrespondingFile] = useState<{ exists: boolean; fileName: string } | null>(null);
  const [allPages, setAllPages] = useState<string[]>([]);
  const navigate = useNavigate();

  // Add the new feature from remote
  useKeyboardShortcut(defaultShortcuts.editPage, () => {
    if (pageFileName) {
      navigate(`/edit/${pageFileName}`);
    }
  });

  // handleDelete is defined below, so we need to wrap the call in a function
  const handleDeleteShortcut = () => {
    handleDelete();
  };

  useKeyboardShortcut(defaultShortcuts.deletePage, handleDeleteShortcut);

  useEffect(() => {
    const fetchAllPages = async () => {
      try {
        const token = localStorage.getItem('gwiki-token');
        const response = await fetch('/api/pages/all', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAllPages(data);
        }
      } catch (err) {
        console.error('Failed to fetch all pages:', err);
      }
    };
    fetchAllPages();
  }, []);

  useEffect(() => {
    const checkCorrespondingFile = async () => {
      if (pageFileName) {
        try {
          const token = localStorage.getItem('gwiki-token');
          const response = await fetch(`/api/pages/exists/${pageFileName}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setCorrespondingFile(data);
          }
        } catch (err) {
          console.error('Failed to check for corresponding file:', err);
        }
      }
    };
    checkCorrespondingFile();
  }, [pageFileName]);

  useEffect(() => {
    const fetchSearchResults = async (searchTerm: string) => {
      try {
        const token = localStorage.getItem('gwiki-token');
        const response = await fetch(`/api/search?q=${searchTerm}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setNotFoundFilenameMatches(data.filenameMatches || []);
          setNotFoundContentMatches(data.contentMatches || []);
        }
      } catch (err) {
        console.error('Search failed:', err);
      }
    };

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
          if (pageName) {
            fetchSearchResults(pageName);
          }
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch page');
        }
        const data = await response.text();
        setContent(data);
        setError(null);
        setNotFoundFilenameMatches([]);
        setNotFoundContentMatches([]);
        setConversionStatus(null);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    fetchPage();
  }, [pageFileName, navigate, pageName]);

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
        onPageUpdate();
        navigate('/');
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
  };

  const handleConvertToMarkdown = async () => {
    if (!pageFileName?.endsWith('.moniwiki')) {
      setConversionStatus('This is not a Moniwiki file.');
      return;
    }
    if (window.confirm(`Are you sure you want to convert "${pageFileName}" to Markdown? A new file "${pageName}.md" will be created.`)) {
      setConversionStatus('Converting...');
      try {
        const token = localStorage.getItem('gwiki-token');
        if (!token) {
          navigate('/login');
          return;
        }
        const markdownContent = convertMoniwikiToMarkdown(content);
        const newFileName = `${pageName}.md`;
        const response = await fetch(`/api/pages/convert-moniwiki`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ originalFileName: pageFileName, newFileName, markdownContent }),
        });
        if (response.status === 401 || response.status === 403) {
          navigate('/login');
          return;
        }
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to convert Moniwiki to Markdown');
        }
        setConversionStatus(`Successfully converted to ${newFileName}`);
        onPageUpdate();
        navigate(`/pages/${newFileName}`);
      } catch (err) {
        setConversionStatus(`Error: ${getErrorMessage(err)}`);
      }
    }
  };

  return (
    <div className="page-viewer">
      {error ? (
        <div>
          <h2>{error}</h2>
          {(notFoundFilenameMatches.length > 0 || notFoundContentMatches.length > 0) && (
            <div className="not-found-search">
              <h3>Search results for "{pageName}":</h3>
              {notFoundFilenameMatches.length > 0 && (
                <div className="results-section">
                  <h4>Filename Matches</h4>
                  <ul>
                    {notFoundFilenameMatches.map((page) => (
                      <li key={page}><Link to={`/pages/${page}`}>{page}</Link></li>
                    ))}
                  </ul>
                </div>
              )}
              {notFoundContentMatches.length > 0 && (
                <div className="results-section">
                  <h4>Content Matches</h4>
                  <ul>
                    {notFoundContentMatches.map((page) => (
                      <li key={page}><Link to={`/pages/${page}`}>{page}</Link></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="page-header">
            <div className="title-group">
              {pageFileName?.endsWith('.moniwiki') && (<span className="moniwiki-tag">MONIWIKI</span>)}
              <h2>{pageName}</h2>
              {correspondingFile?.exists && (
                <div className="markdown-link">
                  <Link to={`/pages/${correspondingFile.fileName}`} className={pageFileName?.endsWith('.moniwiki') ? "markdown-version-link" : "moniwiki-version-link"}>
                    {pageFileName?.endsWith('.moniwiki') ? 'MARKDOWN EXISTS' : 'MONIWIKI EXISTS'}
                  </Link>
                </div>
              )}
            </div>
            <div className="page-actions">
              {pageFileName?.endsWith('.moniwiki') && (
                <button onClick={handleConvertToMarkdown} className="convert-button">Convert to Markdown</button>
              )}
              <Link to={`/edit/${pageFileName}`} className="edit-page-button">Edit Page</Link>
              <button onClick={handleDelete} className="delete-page-button">Delete Page</button>
            </div>
          </div>
          {conversionStatus && <div className="conversion-status">{conversionStatus}</div>}
          <ContentRenderer
            className="page-content"
            content={content}
            allPages={allPages}
            isMoniwiki={pageFileName?.endsWith('.moniwiki')}
          />
        </>
      )}
    </div>
  );
};

export default PageViewer;