import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './TitleIndexPage.css';

const KOREAN_CONSONANTS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const KOREAN_CONSONANT_MAP = {
  'ㄱ': '가', 'ㄲ': '까', 'ㄴ': '나', 'ㄷ': '다', 'ㄸ': '따', 'ㄹ': '라', 'ㅁ': '마', 'ㅂ': '바', 'ㅃ': '빠', 'ㅅ': '사', 'ㅆ': '싸', 'ㅇ': '아', 'ㅈ': '자', 'ㅉ': '짜', 'ㅊ': '차', 'ㅋ': '카', 'ㅌ': '타', 'ㅍ': '파', 'ㅎ': '하'
};

const getInitialConsonant = (char: string): string => {
  if (!char) return '...';

  const firstChar = char[0];
  const charCode = firstChar.charCodeAt(0);

  // For Korean
  if (charCode >= 0xAC00 && charCode <= 0xD7A3) {
    const consonantIndex = Math.floor((charCode - 0xAC00) / 588);
    return KOREAN_CONSONANTS[consonantIndex];
  }

  // For English
  const upperChar = firstChar.toUpperCase();
  if (upperChar >= 'A' && upperChar <= 'Z') {
    return upperChar;
  }

  // For Numbers
  if (upperChar >= '0' && upperChar <= '9') {
    return '#';
  }

  return '...';
};

const TitleIndexPage: React.FC = () => {
  const [pages, setPages] = useState<string[]>([]);
  const [groupedPages, setGroupedPages] = useState<Record<string, string[]>>({});
  const [indexKeys, setIndexKeys] = useState<string[]>([]);

  useEffect(() => {
    const fetchAllPages = async () => {
      try {
        const token = localStorage.getItem('gwiki-token');
        const response = await fetch('/api/pages/all', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPages(data);
        }
      } catch (err) {
        console.error('Failed to fetch all pages:', err);
      }
    };
    fetchAllPages();
  }, []);

  useEffect(() => {
    if (pages.length > 0) {
      const groups: Record<string, string[]> = {};
      pages.forEach(page => {
        const key = getInitialConsonant(page);

        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(page);
      });

      setGroupedPages(groups);
      
      const allIndexKeys = [...KOREAN_CONSONANTS, ...Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i)), '#', '...'];
      setIndexKeys(allIndexKeys);
    }
  }, [pages]);

  const getDisplayKey = (key: string) => {
    if (KOREAN_CONSONANT_MAP[key as keyof typeof KOREAN_CONSONANT_MAP]) {
      return KOREAN_CONSONANT_MAP[key as keyof typeof KOREAN_CONSONANT_MAP];
    }
    return key;
  }

  return (
    <div className="title-index-page">
      <h2>Title Index</h2>
      <div className="title-index-nav">
        {indexKeys.map(key => (
          <a href={`#${key}`} key={key}>{getDisplayKey(key)}</a>
        ))}
      </div>
      {indexKeys.map(key => {
        if (groupedPages[key]) {
          return (
            <div key={key} className="title-index-group">
              <h3 id={key}>{getDisplayKey(key)}</h3>
              <ul>
                {groupedPages[key].map(page => (
                  <li key={page}>
                    <Link to={`/pages/${encodeURIComponent(page)}`}>{page}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        }
        return null;
      })}
    </div>
  );
};

export default TitleIndexPage;