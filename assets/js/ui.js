/**
 * ============================================================
 * oohi Writing Tool - ui.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * DOM操作・UI更新を担当
 */
const UI = (() => {
  const els = {};

  function cacheElements() {
    els.urlInput = document.getElementById('urlInput');
    els.fetchBtn = document.getElementById('fetchBtn');
    els.loading = document.getElementById('loading');
    els.mainContent = document.getElementById('mainContent');
    els.panelLeft = document.getElementById('panelLeft');
    els.panelRight = document.getElementById('panelRight');
    els.articleMeta = document.getElementById('articleMeta');
    els.articleBody = document.getElementById('articleBody');
    els.historyModal = document.getElementById('historyModal');
    els.historyList = document.getElementById('historyList');
    els.historyToggle = document.getElementById('historyToggle');
    els.historyClose = document.getElementById('historyClose');
    els.themeToggle = document.getElementById('themeToggle');
    els.toast = document.getElementById('toast');
  }

  function showLoading() {
    els.loading.classList.remove('hidden');
    els.mainContent.classList.add('hidden');
  }

  function hideLoading() {
    els.loading.classList.add('hidden');
  }

  function showMain() {
    els.mainContent.classList.remove('hidden');
  }

  function renderArticle(article) {
    els.articleMeta.innerHTML = `
      <h2>${escapeHTML(article.title)}</h2>
      <div class="meta-url">${escapeHTML(article.url)}</div>
      <div style="margin-top:8px; font-size:.8rem; color:var(--text-muted);">
        文字数: ${article.charCount.toLocaleString()} ｜
        見出し数: ${article.headings.length} ｜
        段落数: ${article.paragraphs}
      </div>`;

    els.articleBody.innerHTML = article.displayHTML;
  }

  function renderResults(result) {
    let html = '';
    html += ScoreCard.render('seo', 'SEO診断', result.seo);
    html += ScoreCard.render('cvr', 'CVR診断', result.cvr);
    html += PersonaCard.render(result.persona);
    html += KeywordList.renderEmotion(result.emotions);
    html += KeywordList.renderKeywords(result.keywords);
    html += KeywordList.renderCompetitor();
    html += KeywordList.renderSuggestions(result.suggestions);
    html += KeywordList.renderAdvice(result.advice);

    els.panelLeft.innerHTML = html;

    requestAnimationFrame(() => {
      setTimeout(() => {
        ScoreCard.animateScore('seo', result.seo.total);
        ScoreCard.animateScore('cvr', result.cvr.total);
        ScoreCard.animateBars();
        KeywordList.animateEmotionBars();
      }, 100);
    });
  }

  function showToast(msg, duration) {
    if (!duration) duration = 2000;
    els.toast.textContent = msg;
    els.toast.classList.remove('hidden');
    setTimeout(() => {
      els.toast.classList.add('hidden');
    }, duration);
  }

  function showHistory(history) {
    if (history.length === 0) {
      els.historyList.innerHTML = '<div class="history-empty">履歴がありません</div>';
    } else {
      let html = '';
      history.forEach((item, idx) => {
        const date = new Date(item.date).toLocaleString('ja-JP');
        html += `
          <div class="history-item" data-index="${idx}">
            <div class="history-title">${escapeHTML(item.title)}</div>
            <div class="history-url">${escapeHTML(item.url)}</div>
            <div class="history-scores">
              <span class="history-score history-seo">SEO ${item.seoScore}</span>
              <span class="history-score history-cvr">CVR ${item.cvrScore}</span>
            </div>
            <div class="history-date">${date}</div>
          </div>`;
      });
      els.historyList.innerHTML = html;
    }
    els.historyModal.classList.remove('hidden');
  }

  function hideHistory() {
    els.historyModal.classList.add('hidden');
  }

  function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  function loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
  }

  function showError(msg) {
    hideLoading();
    showToast(msg, 4000);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getURL() {
    return (els.urlInput.value || '').trim();
  }

  function disableFetchBtn() {
    els.fetchBtn.disabled = true;
    els.fetchBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> 読み込み中...';
  }

  function enableFetchBtn() {
    els.fetchBtn.disabled = false;
    els.fetchBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg> 分析する';
  }

  return {
    cacheElements,
    showLoading,
    hideLoading,
    showMain,
    renderArticle,
    renderResults,
    showToast,
    showHistory,
    hideHistory,
    toggleTheme,
    loadTheme,
    showError,
    getURL,
    disableFetchBtn,
    enableFetchBtn,
    get els() { return els; }
  };
})();
