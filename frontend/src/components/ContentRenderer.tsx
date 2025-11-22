import React, { useEffect, useRef } from 'react';

interface ContentRendererProps {
  html: string;
  className: string;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ html, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    // Clear previous content to avoid duplicating nodes on re-render
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.innerHTML = html;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);

    const textNodes: Node[] = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      // Check if the parent is not an anchor or code tag
      if (currentNode.parentElement?.tagName !== 'A' && currentNode.parentElement?.tagName !== 'CODE') {
        textNodes.push(currentNode);
      }
      currentNode = walker.nextNode();
    }

    const urlRegex = /(https?:\/\/[^\s<>"'`]+)/g;

    textNodes.forEach(node => {
      const text = node.textContent;
      if (text && urlRegex.test(text)) {
        const parent = node.parentNode;
        if (parent) {
          const fragment = document.createDocumentFragment();
          const parts = text.split(urlRegex);

          parts.forEach((part, index) => {
            if (index % 2 === 1) { // This is a URL
              const a = document.createElement('a');
              a.href = part;
              a.target = '_blank';
              a.rel = 'noopener noreferrer';
              a.textContent = part;
              fragment.appendChild(a);
            } else if (part) {
              fragment.appendChild(document.createTextNode(part));
            }
          });
          parent.replaceChild(fragment, node);
        }
      }
    });

  }, [html]);

  return <div ref={containerRef} className={className} />;
};

export default ContentRenderer;
