import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import './PageViewer.css';

import { parseMoniwiki, convertMoniwikiToMarkdown } from '../utils/moniwiki-parser';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

interface PageViewerProps {
  onPageUpdate: () => void;
  pages: string[];
}

const PageViewer: React.FC<PageViewerProps> = ({ onPageUpdate, pages }) => {
  const { pageFileName } = useParams<{ pageFileName: string }>();
  const pageName = pageFileName ? pageFileName.split('.').slice(0, -1).join('.') : '';
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notFoundFilenameMatches, setNotFoundFilenameMatches] = useState<string[]>([]);
  const [notFoundContentMatches, setNotFoundContentMatches] = useState<string[]>([]);
  const [conversionStatus, setConversionStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  const correspondingMdFile = `${pageName}.md`;
  const mdFileExists = pages.includes(correspondingMdFile);

  const correspondingMoniwikiFile = `${pageName}.moniwiki`;
  const moniwikiFileExists = pages.includes(correspondingMoniwikiFile);

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
        // Don't update the main error state, just log it
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
        setNotFoundFilenameMatches([]); // Clear filename search results on successful page load
        setNotFoundContentMatches([]); // Clear content search results on successful page load
        setConversionStatus(null); // Clear conversion status on new page load
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };

    fetchPage();
  }, [pageFileName, navigate, pageName]);

  const getRenderedContent = () => {
    console.log('Rendering content for:', pageFileName);
    console.log('Raw content:', content);

    const renderer = new marked.Renderer();
    renderer.link = ({ href, title, text }) => {
      if (href && href.endsWith('.moniwiki')) {
        const titleAttr = title ? ` title="${title}"` : '';
        return `<a href="${href}"${titleAttr} class="moniwiki-link">${text} <span class="moniwiki-inline-tag">MONIWIKI</span></a>`;
      }
      
      // Fallback for default link rendering
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    };

    let rawMarkup;
    if (pageFileName?.endsWith('.moniwiki')) {
      console.log('Using Moniwiki parser.');
      rawMarkup = parseMoniwiki(content);
    } else {
      console.log('Using Markdown parser.');
      rawMarkup = marked(content, { renderer });
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
        onPageUpdate(); // Refresh the page list to show the new file
        navigate(`/pages/${newFileName}`); // Navigate to the new markdown page
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
                      <li key={page}>
                        <Link to={`/pages/${page}`}>{page}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {notFoundContentMatches.length > 0 && (
                <div className="results-section">
                  <h4>Content Matches</h4>
                  <ul>
                    {notFoundContentMatches.map((page) => (
                      <li key={page}>
                        <Link to={`/pages/${page}`}>{page}</Link>
                      </li>
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
              {pageFileName?.endsWith('.moniwiki') && (
                <span className="moniwiki-tag">MONIWIKI</span>
              )}
              <h2>{pageName}</h2>
              {mdFileExists && pageFileName?.endsWith('.moniwiki') && (
                <div className="markdown-link">
                  <Link to={`/pages/${correspondingMdFile}`} className="markdown-version-link">DO NOT UPDATE THIS. USE MARKDOWN FILE</Link>
                </div>
              )}
            </div>
            {moniwikiFileExists && pageFileName?.endsWith('.md') && (
              <div className="old-file-link">
                <Link to={`/pages/${correspondingMoniwikiFile}`} className="old-version-link">moniwiki file exists</Link>
              </div>
            )}
            <div className="page-actions">
              {pageFileName?.endsWith('.moniwiki') && (
                <button onClick={handleConvertToMarkdown} className="convert-button">
                  Convert to Markdown
                </button>
              )}
              <Link to={`/edit/${pageFileName}`} className="edit-page-button">
                Edit Page
              </Link>
              <button onClick={handleDelete} className="delete-page-button">
                Delete Page
              </button>
            </div>
          </div>
          {conversionStatus && <div className="conversion-status">{conversionStatus}</div>}
          <div className="page-content" dangerouslySetInnerHTML={getRenderedContent()} />
        </>
      )}
    </div>
  );
};

export default PageViewer;
