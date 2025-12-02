import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { parseMoniwiki } from '../utils/moniwiki-parser';

interface ContentRendererProps {
  className?: string;
  content: string;
  allPages: string[];
  isMoniwiki?: boolean;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({
  className,
  content,
  allPages,
  isMoniwiki,
}) => {
  const [renderedHtml, setRenderedHtml] = useState('');

  useEffect(() => {
    const renderMarkup = async () => {
      if (isMoniwiki) {
        const html = parseMoniwiki(content, allPages);
        setRenderedHtml(html);
        return;
      }

      // For Markdown files, use marked with a custom renderer
      const renderer = new marked.Renderer();
      const originalLinkRenderer = renderer.link.bind(renderer);

      renderer.link = (props) => {
        let { href, title, text } = props;

        if (!href) {
          return originalLinkRenderer(props);
        }
        href = href.trim();

        if (/^(https?:|ftp:|mailto:)/.test(href)) {
          const titleAttr = title ? ` title="${title}"` : '';
          return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
        }

        if (!href.startsWith('/') && !href.startsWith('#')) {
          try {
            const pageFileName = decodeURIComponent(href);
            const pageExists = allPages.includes(pageFileName);
            const pageNameForSearch = pageFileName.split('.').slice(0, -1).join('.') || pageFileName;
            const searchUrl = `/search?q=${encodeURIComponent(pageNameForSearch)}`;

            if (pageExists) {
              if (pageFileName.endsWith('.moniwiki')) {
                const titleAttr = title ? ` title="${title}"` : '';
                return `<a href="/pages/${encodeURIComponent(pageFileName)}"${titleAttr} class="moniwiki-link">${text} <span class="moniwiki-inline-tag">MONIWIKI</span></a>`;
              }
              return `<a href="/pages/${encodeURIComponent(pageFileName)}">${text}</a>`;
            } else {
              if (pageFileName.endsWith('.moniwiki')) {
                return `<a href="${searchUrl}" class="red-link">${text} <span class="moniwiki-inline-tag">MONIWIKI</span></a>`;
              }
              return `<a href="${searchUrl}" class="red-link">${text}</a>`;
            }
          } catch (e) {
            console.error('URIError during link processing:', e);
          }
        }
        return originalLinkRenderer(props);
      };

      const processedContent = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
        const trimmedUrl = url.trim();
        if (!/^(https?:|ftp:|mailto:)/.test(trimmedUrl)) {
          const encodedUrl = trimmedUrl.split('/').map((segment: string) => encodeURIComponent(segment)).join('/');
          return `[${text}](${encodedUrl})`;
        }
        return `[${text}](${trimmedUrl})`;
      });

      // Use await to handle the async nature of marked
      const rawMarkup = await marked(processedContent, { renderer });
      setRenderedHtml(rawMarkup);
    };

    renderMarkup();
  }, [content, allPages, isMoniwiki]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

export default ContentRenderer;