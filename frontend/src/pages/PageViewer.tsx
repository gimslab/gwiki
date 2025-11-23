import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import './PageViewer.css';

import { parseMoniwiki, convertMoniwikiToMarkdown } from '../utils/moniwiki-parser';
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
  pages: string[];
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

  useKeyboardShortcut(defaultShortcuts.editPage, () => {
    if (pageFileName) {
      navigate(`/edit/${pageFileName}`);
    }
  });

  useKeyboardShortcut(defaultShortcuts.deletePage, () => {
    handleDelete();
  });



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
    // For moniwiki files, use the specific parser and return
    if (pageFileName?.endsWith('.moniwiki')) {
      return { __html: parseMoniwiki(content, allPages) };
    }

    // For Markdown files, use marked with a custom renderer
    const renderer = new marked.Renderer();
    const originalLinkRenderer = renderer.link.bind(renderer);

    renderer.link = (props) => {
      let { href, title, text } = props;

      if (!href) {
        return originalLinkRenderer(props);
      }
      href = href.trim(); // Trim whitespace from href

      // 1. Check for external links
      if (/^(https?:|ftp:|mailto:)/.test(href)) {
        const titleAttr = title ? ` title="${title}"` : '';
        return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
      }

      // 2. Check for internal wiki links (relative paths that are not fragments)
      if (!href.startsWith('/') && !href.startsWith('#')) {
        try {
          const pageFileName = decodeURIComponent(href);
          const pageExists = allPages.includes(pageFileName);
          if (pageExists) {
            // moniwiki extension is a special case for styling
            if (pageFileName.endsWith('.moniwiki')) {
              const titleAttr = title ? ` title="${title}"` : '';
              return `<a href="/pages/${encodeURIComponent(pageFileName)}"${titleAttr} class="moniwiki-link">${text} <span class="moniwiki-inline-tag">MONIWIKI</span></a>`;
            }
            return `<a href="/pages/${encodeURIComponent(pageFileName)}">${text}</a>`;
          } else {
            // create a red link to search page
            const pageNameForSearch = pageFileName.split('.').slice(0, -1).join('.') || pageFileName;
            const searchUrl = `/search?q=${encodeURIComponent(pageNameForSearch)}`;
            if (pageFileName.endsWith('.moniwiki')) {
              return `<a href="${searchUrl}" class="red-link">${text} <span class="moniwiki-inline-tag">MONIWIKI</span></a>`;
            }
            return `<a href="${searchUrl}" class="red-link">${text}</a>`;
          }
        } catch (e) {
          console.error('URIError during link processing:', e);
          // fall through to original renderer
        }
      }

      // 3. Fallback for other links (like absolute paths /... or fragments #...)
      return originalLinkRenderer(props);
    };

    // Pre-process markdown to encode internal link URLs before passing to marked
    const processedContent = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      // only encode if it's NOT an external link
      const trimmedUrl = url.trim();
      if (!/^(https?:|ftp:|mailto:)/.test(trimmedUrl)) {
        const encodedUrl = trimmedUrl.split('/').map((segment: string) => encodeURIComponent(segment)).join('/');
        return `[${text}](${encodedUrl})`;
      }
      return `[${text}](${trimmedUrl})`; // Return with trimmed url
    });

    const rawMarkup = marked(processedContent, { renderer }) as string;
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

              {correspondingFile?.exists && (

                <div className="markdown-link">

                  <Link

                    to={`/pages/${correspondingFile.fileName}`}

                    className={pageFileName?.endsWith('.moniwiki') ? "markdown-version-link" : "moniwiki-version-link"}

                  >

                    {pageFileName?.endsWith('.moniwiki') ? 'MARKDOWN EXISTS' : 'MONIWIKI EXISTS'}

                  </Link>

                </div>

              )}

            </div>

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

          <ContentRenderer className="page-content" html={getRenderedContent().__html} />

        </>

      )}

    </div>

  );

};



export default PageViewer;


