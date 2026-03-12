/**
 * ============================================================
 * oohi Writing Tool - articleLoader.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * Proxy API経由で記事HTMLを取得し、タイトル・見出し・本文を抽出
 */
const ArticleLoader = (() => {

  async function fetchHTML(url) {
    const encodedURL = encodeURIComponent(url);
    const proxies = [
      { url: `https://api.allorigins.win/get?url=${encodedURL}`, json: true },
      { url: `https://api.allorigins.win/raw?url=${encodedURL}`, json: false },
      { url: `https://api.codetabs.com/v1/proxy?quest=${encodedURL}`, json: false }
    ];

    let lastError = null;
    for (const proxy of proxies) {
      try {
        const res = await fetch(proxy.url);
        if (!res.ok) continue;
        if (proxy.json) {
          const data = await res.json();
          if (data && data.contents) return data.contents;
        } else {
          const text = await res.text();
          if (text && text.length > 100) return text;
        }
      } catch (e) {
        lastError = e;
      }
    }
    throw new Error(lastError ? `取得に失敗しました: ${lastError.message}` : '記事を取得できませんでした。URLを確認してください。');
  }

  function parseHTML(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  function cleanDOM(doc) {
    const removeSelectors = [
      'script', 'style', 'noscript', 'iframe', 'nav', 'footer',
      'header', '.sidebar', '.menu', '.navigation', '.ad', '.advertisement',
      '.social-share', '.comment', '.comments', '.related-posts',
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
    ];
    removeSelectors.forEach(sel => {
      doc.querySelectorAll(sel).forEach(el => el.remove());
    });
    return doc;
  }

  function extractTitle(doc) {
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    if (ogTitle) return ogTitle.getAttribute('content') || '';

    const h1 = doc.querySelector('h1');
    if (h1) return h1.textContent.trim();

    const titleEl = doc.querySelector('title');
    return titleEl ? titleEl.textContent.trim() : '';
  }

  function extractHeadings(doc) {
    const headings = [];
    doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      const text = h.textContent.trim();
      if (text.length > 0) {
        headings.push({ level: parseInt(h.tagName.charAt(1)), text: text });
      }
    });
    return headings;
  }

  function extractBody(doc) {
    const candidates = [
      doc.querySelector('article'),
      doc.querySelector('[role="main"]'),
      doc.querySelector('main'),
      doc.querySelector('.post-content'),
      doc.querySelector('.entry-content'),
      doc.querySelector('.article-content'),
      doc.querySelector('.content'),
      doc.querySelector('#content'),
      doc.body
    ];

    let contentEl = null;
    for (const el of candidates) {
      if (el && el.textContent.trim().length > 100) {
        contentEl = el;
        break;
      }
    }

    if (!contentEl) contentEl = doc.body;
    return contentEl;
  }

  function buildDisplayHTML(contentEl) {
    if (!contentEl) return '';

    let html = '';
    const allowed = ['H1','H2','H3','H4','H5','H6','P','UL','OL','LI','TABLE','THEAD','TBODY','TR','TH','TD','BLOCKQUOTE','PRE','CODE','IMG','A','STRONG','EM','BR','SPAN','DIV','FIGURE','FIGCAPTION','DL','DT','DD'];

    function walk(node) {
      if (node.nodeType === 3) {
        const text = node.textContent;
        if (text.trim().length > 0) html += text;
        return;
      }
      if (node.nodeType !== 1) return;

      const tag = node.tagName;
      if (!allowed.includes(tag)) {
        node.childNodes.forEach(c => walk(c));
        return;
      }

      if (tag === 'DIV' || tag === 'SPAN') {
        node.childNodes.forEach(c => walk(c));
        return;
      }

      if (tag === 'IMG') {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '';
        if (src) html += `<img src="${src}" alt="${alt}" loading="lazy">`;
        return;
      }

      if (tag === 'A') {
        const href = node.getAttribute('href') || '';
        html += `<a href="${href}" target="_blank" rel="noopener">`;
        node.childNodes.forEach(c => walk(c));
        html += '</a>';
        return;
      }

      const lowerTag = tag.toLowerCase();
      html += `<${lowerTag}>`;
      node.childNodes.forEach(c => walk(c));
      html += `</${lowerTag}>`;
    }

    contentEl.childNodes.forEach(c => walk(c));
    html = html.replace(/<p>\s*<\/p>/g, '');
    return html;
  }

  async function load(url) {
    const rawHTML = await fetchHTML(url);
    const doc = parseHTML(rawHTML);
    cleanDOM(doc);

    const title = extractTitle(doc);
    const headings = extractHeadings(doc);
    const contentEl = extractBody(doc);
    const bodyText = contentEl ? contentEl.textContent.replace(/\s+/g, ' ').trim() : '';
    const displayHTML = buildDisplayHTML(contentEl);

    const charCount = TextAnalyzer.countChars(bodyText);
    const paragraphs = TextAnalyzer.countParagraphs(bodyText);
    const avgSentLen = TextAnalyzer.avgSentenceLength(bodyText);

    return { url, title, headings, bodyText, displayHTML, charCount, paragraphs, avgSentLen };
  }

  return { load };
})();
