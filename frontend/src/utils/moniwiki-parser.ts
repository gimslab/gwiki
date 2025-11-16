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
      closeLists();
      html += '<pre><code>';
      inCodeBlock = true;
      continue;
    }
    if (line.startsWith('}}}')) {
      html += '</code></pre>\n';
      inCodeBlock = false;
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
    processedLine = processedLine.replace(/-->\s*\[([^\]]+)\]/g, (_, p1) => {
      const encodedPageName = encodeURIComponent(p1);
      return `--> <span><a href="/pages/${encodedPageName}.moniwiki">${p1}</a></span>`;
    });

    // Moniwiki single bracket link: [http://abc.com xxx yyy]
    processedLine = processedLine.replace(/\[(https?:\/\/[^\]\s]+)\s([^\]]+)\]/g, '<a href="$1">$2</a>');

    // Quoted internal link: ["PageName"]
    processedLine = processedLine.replace(/\["([^"]+)"\]/g, (_, p1) => {
      const encodedPageName = encodeURIComponent(p1);
      return `<a href="/pages/${encodedPageName}.moniwiki">${p1}</a>`;
    });

    // Old-style internal link: [PageName]
    processedLine = processedLine.replace(/(?<!\[)\[([^\[\]]+)\](?!\])/g, (_, p1) => {
      const encodedPageName = encodeURIComponent(p1);
      return `<a href="/pages/${encodedPageName}.moniwiki">${p1}</a>`;
    });

    // Links
    processedLine = processedLine.replace(/\[\[(https?:\/\/[^|]+)\|([^\]]+)\]\]/g, '<a href="$1">$2</a>');
    // Moniwiki Macros (case-insensitive)
    processedLine = processedLine.replace(/\[\[([a-zA-Z0-9_]+)\]\]/gi, '{{$1}}');
    // Generic internal link (should be after macros to avoid conflicts)
    processedLine = processedLine.replace(/\[\[([^\]]+)\]\]/g, (_, p1) => {
      const encodedPageName = encodeURIComponent(p1);
      return `<a href="/pages/${encodedPageName}">${p1}</a>`;
    });

    // Autolink URLs
    processedLine = processedLine.replace(/(?<!href=")(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');

    html += processedLine + '<br>\n';
  }

  closeLists();

  // Apply inline formatting after all other parsing to avoid conflicts with link structures
  html = html.replace(/'''(.*?)'''/g, '<strong>$1</strong>');
  html = html.replace(/''(.*?)''/g, '<em>$1</em>');

  // Apply strikethrough only to text that is not inside an HTML tag.
  html = html.replace(/--(([^<>]|<>)*)--/g, '<del>$1</del>');

  // The list logic is still very basic. A full implementation would require a proper parser.
  // For now, we will replace the simple list logic with a slightly better one that just wraps lines.
  // This is a placeholder for a more robust implementation.
  const finalHtml = html.replace(/<\/li>\n\s*<li>/g, '</li>\n<li>'); // Basic cleanup

  return finalHtml;
};

export const convertMoniwikiToMarkdown = (moniwikiText: string): string => {
  if (!moniwikiText) {
    return '';
  }

  const lines = moniwikiText.split('\n');
  let markdown = '';
  let inCodeBlock = false;

  for (const line of lines) {
    // Code blocks
    if (line.startsWith('{{{')) {
      markdown += '```\n';
      inCodeBlock = true;
      continue;
    }
    if (line.startsWith('}}}')) {
      markdown += '```\n';
      inCodeBlock = false;
      continue;
    }
    if (inCodeBlock) {
      markdown += line + '\n';
      continue;
    }

    // Headings
    if (line.match(/^={1,5}\s.*\s={1,5}$/)) {
      const level = line.match(/^(=+)/)![1].length;
      const content = line.replace(/^=+\s/, '').replace(/\s=+$/, '');
      markdown += '#'.repeat(level) + ` ${content}\n`;
      continue;
    }

    // Horizontal rule
    if (line.match(/^----/)) {
      markdown += '---\n';
      continue;
    }
    
    // Metadata
    if (line.startsWith('#')) {
      markdown += '```\n' + line + '\n```\n';
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      markdown += `> ${line.substring(2)}\n`;
      continue;
    }

    // Unordered list
    if (line.match(/^\s*\*/)) {
      markdown += line.replace(/^\s*\*\s?/, '* ') + '\n';
      continue;
    }

    // Ordered list
    if (line.match(/^\s*([0-9]+\.|[a-zA-Z]\.)/)) {
      markdown += line.replace(/^\s*([0-9]+\.|[a-zA-Z]\.)\s?/, '$1 ') + '\n';
      continue;
    }

    // Inline formatting
    let processedLine = line;

    // Moniwiki single bracket link: [http://abc.com xxx yyy]
    processedLine = processedLine.replace(/\[(https?:\/\/[^\]\s]+)\s([^\]]+)\]/g, '[$2]($1)');

    // Moniwiki specific link: --> [PageName] (This is a Moniwiki specific rendering, not a direct markdown equivalent, so we'll convert it to a standard internal link)
    processedLine = processedLine.replace(/-->\s*\[([^\]]+)\]/g, '[[$1]]'); // This will be handled by the next regex

    // Quoted internal link: ["PageName"]
    processedLine = processedLine.replace(/\["([^"]+)"\]/g, '[[$1]]');

    // Old-style internal link: [PageName]
    processedLine = processedLine.replace(/(?<!\[)\[([^\[\]]+)\](?!\s*\()/g, '[[$1]]'); // Convert to MediaWiki style internal link, which can be further processed if needed

    // Links: [[https://example.com|Example]] -> [Example](https://example.com)
    processedLine = processedLine.replace(/\[\[(https?:\/\/[^|]+)\|([^\]]+)\]\]/g, '[$2]($1)');
    // Links: [[PageName]] -> [PageName](/pages/PageName.moniwiki) (assuming internal pages are at /pages/PageName.moniwiki)
    processedLine = processedLine.replace(/\[\[([^\]]+)\]\]/g, '[$1](/pages/$1.moniwiki)');


    markdown += processedLine + '\n';
  }

  // Apply inline formatting after all other parsing to avoid conflicts with link structures
  markdown = markdown.replace(/'''(.*?)'''/g, '**$1**');
  markdown = markdown.replace(/''(.*?)''/g, '*$1*');
  markdown = markdown.replace(/--((?:(?!\[|\]).)*?)--/g, '~~$1~~'); // Use a more robust regex for strikethrough

  return markdown;
};
