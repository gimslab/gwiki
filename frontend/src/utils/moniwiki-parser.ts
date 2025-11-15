// frontend/src/utils/moniwiki-parser.ts

export const parseMoniwiki = (text: string): string => {
  if (!text) {
    return '';
  }

  const lines = text.split('\n');
  let html = '';
  let inCodeBlock = false;
  let inUnorderedList = false;
  let inOrderedList = false;

  const closeLists = () => {
    if (inUnorderedList) {
      html += '</ul>\n';
      inUnorderedList = false;
    }
    if (inOrderedList) {
      html += '</ol>\n';
      inOrderedList = false;
    }
  };

  for (const line of lines) {
    // Code blocks
    if (line.startsWith('{{{')) {
      if (inCodeBlock) {
        html += '</pre></code>\n';
        inCodeBlock = false;
      } else {
        closeLists();
        html += '<pre><code>';
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      html += line + '\n';
      continue;
    }

    // Headings
    if (line.match(/^={1,5}\s.*\s={1,5}$/)) {
      closeLists();
      const level = line.match(/^(=+)/)![1].length;
      const content = line.replace(/^=+\s/, '').replace(/\s=+$/, '');
      html += `<h${level}>${content}</h${level}>\n`;
      continue;
    }

    // Horizontal rule
    if (line.match(/^----/)) {
      closeLists();
      html += '<hr>\n';
      continue;
    }
    
    // Metadata
    if (line.startsWith('#')) {
        closeLists();
        html += `<pre><code>${line}</code></pre>\n`;
        continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      closeLists();
      html += `<blockquote>${line.substring(2)}</blockquote>\n`;
      continue;
    }

    // Unordered list
    if (line.match(/^\s*\*/)) {
      if (inOrderedList) closeLists();
      if (!inUnorderedList) {
        html += '<ul>\n';
        inUnorderedList = true;
      }
      const depth = (line.match(/^\s*/) || [''])[0].length / 2;
      html += '  '.repeat(depth) + `<li>${line.replace(/^\s*\*\s?/, '')}</li>\n`;
      continue;
    }

    // Ordered list
    if (line.match(/^\s*([0-9]+\.|[a-zA-Z]\.)/)) {
        if (inUnorderedList) closeLists();
        if (!inOrderedList) {
            html += '<ol>\n';
            inOrderedList = true;
        }
        const depth = (line.match(/^\s*/) || [''])[0].length / 2;
        html += '  '.repeat(depth) + `<li>${line.replace(/^\s*([0-9]+\.|[a-zA-Z]\.)\s?/, '')}</li>\n`;
        continue;
    }


    // If we are no longer in a list, close it
    if (!line.match(/^\s*(\*|([0-9]+\.|[a-zA-Z]\.))/) && (inUnorderedList || inOrderedList)) {
        closeLists();
    }


    // Inline formatting
    let processedLine = line;

    // Moniwiki specific link: --> [PageName]
    processedLine = processedLine.replace(/-->\s*\[([^\]]+)\]/g, '--> <span><a href="/pages/$1.moniwiki">$1</a></span>');

    // Links
    processedLine = processedLine.replace(/\[\[(https?:\/\/[^|]+)\|([^\]]+)\]\]/g, '<a href="$1">$2</a>');
    processedLine = processedLine.replace(/\[\[([^\]]+)\]\]/g, '<a href="/pages/$1">$1</a>');

    // Bold, Italic, Strikethrough
    processedLine = processedLine.replace(/'''(.*?)'''/g, '<strong>$1</strong>');
    processedLine = processedLine.replace(/''(.*?)''/g, '<em>$1</em>');
    processedLine = processedLine.replace(/--(.*?)--/g, '<del>$1</del>');

    html += processedLine + '<br>\n';
  }

  closeLists();

  // This is a simplified parser. For real nested lists, a more complex tree-based approach is needed.
  // The current list implementation just wraps li elements in one ul/ol.
  // Let's refine the list logic slightly to handle simple nesting.
  const fixListNesting = (h: string) => {
      const lines = h.split('\n');
      let result = '';
      let listStack: string[] = [];

      for (const line of lines) {
          if (line.startsWith('<ul>') || line.startsWith('<ol>')) {
              listStack.push(line.startsWith('<ul>') ? 'ul' : 'ol');
              result += line + '\n';
          } else if (line.startsWith('  <li>')) {
              const currentList = listStack[listStack.length - 1];
              if (currentList) {
                  result = result.trimEnd().slice(0, -6) + `\n<${currentList}>\n${line}\n</${currentList}>\n</li>\n`;
              }
          } else {
              result += line + '\n';
          }
      }
      return result;
  };

  // The list logic is still very basic. A full implementation would require a proper parser.
  // For now, we will replace the simple list logic with a slightly better one that just wraps lines.
  // This is a placeholder for a more robust implementation.
  const finalHtml = html.replace(/<\/li>\n\s*<li>/g, '</li>\n<li>'); // Basic cleanup

  return finalHtml;
};
