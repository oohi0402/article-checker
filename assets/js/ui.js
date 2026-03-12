/**
 * ============================================================
 * 大野ヒロアキ流 記事チェック - ui.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * DOM操作・UI更新を担当
 */
const UI = (() => {
  // DOM参照
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

  /**
   * ローディング表示/非表示
   */
  function showLoading() {
    els.loading.classList.remove('hidden');
    els.mainContent.classList.add('hidden');
  }

  function hideLoading() {
    els.loading.classList.add('hidden');
  }

  /**
   * メインコンテンツ表示
   */
  function showMain() {
    els.mainContent.classList.remove('hidden');
  }

  /**
   * 右パネル：記事本文を表示
   */
  function renderArticle(article) {
    els.articleMeta.innerHTML = `
      <h2>${escapeHTML(article.title)}</h2>
      <div class="meta-url">${escapeHTML(article.url)}</div>
      <div style="margin-top:8px; font-size:.85rem; color:var(--text-sub);">
        文字数: ${article.charCount.toLocaleString()} ｜
        見出し数: ${article.headings.length} ｜
        段落数: ${article.paragraphs}
      </div>`;

    els.articleBody.innerHTML = article.displayHTML;
  }

  /**
   * 左パネル：全診断結果カードをレンダリング
   */
  function renderResults(result) {
    let html = '';

    // SEOスコアカード
    html += ScoreCard.render('seo', 'SEO診断', result.seo);

    // CVRスコアカード
    html += ScoreCard.render('cvr', 'CVR診断', result.cvr);

    // ペルソナカード
    html += PersonaCard.render(result.persona);

    // 感情分析
    html += KeywordList.renderEmotion(result.emotions);

    // キーワード分析
    html += KeywordList.renderKeywords(result.keywords);

    // 競合比較
    html += KeywordList.renderCompetitor();

    // 改善提案
    html += KeywordList.renderSuggestions(result.suggestions);

    els.panelLeft.innerHTML = html;

    // アニメーション発火（少し遅延させる）
    requestAnimationFrame(() => {
      setTimeout(() => {
        ScoreCard.animateScore('seo', result.seo.total);
        ScoreCard.animateScore('cvr', result.cvr.total);
        ScoreCard.animateBars();
        KeywordList.animateEmotionBars();
      }, 100);
    });
  }

  /**
   * トースト通知
   */
  function showToast(msg, duration = 2000) {
    els.toast.textContent = msg;
    els.toast.classList.remove('hidden');
    setTimeout(() => {
      els.toast.classList.add('hidden');
    }, duration);
  }

  /**
   * 履歴モーダル表示
   */
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

  /**
   * テーマ切替
   */
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

  /**
   * エラー表示
   */
  function showError(msg) {
    hideLoading();
    showToast(msg, 4000);
  }

  /**
   * HTMLエスケープ
   */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * URL入力値を取得
   */
  function getURL() {
    return (els.urlInput.value || '').trim();
  }

  /**
   * ボタン無効化
   */
  function disableFetchBtn() {
    els.fetchBtn.disabled = true;
    els.fetchBtn.textContent = '読み込み中...';
  }

  function enableFetchBtn() {
    els.fetchBtn.disabled = false;
    els.fetchBtn.textContent = '記事を読み込む';
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
