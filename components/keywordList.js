/**
 * ============================================================
 * 大野ヒロアキ流 記事チェック - keywordList.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * キーワード分析・感情分析・競合比較・改善提案カードのHTML生成
 */
const KeywordList = (() => {

  /**
   * キーワード分析カード
   */
  function renderKeywords(keywords) {
    let tagsHTML = '';
    keywords.forEach(kw => {
      tagsHTML += `
        <span class="keyword-tag">
          ${kw.word}
          <span class="keyword-count">${kw.count}</span>
        </span>`;
    });

    return `
      <div class="card" id="keywordCard">
        <div class="card-header">
          <h2>キーワード分析 TOP10</h2>
          <button class="btn-copy" data-target="keyword" title="コピー">📄</button>
        </div>
        <div class="keyword-cloud">${tagsHTML}</div>
      </div>`;
  }

  /**
   * 感情分析カード
   */
  function renderEmotion(emotions) {
    const emotionData = [
      { key: 'anxiety', label: '不安', cls: 'anxiety' },
      { key: 'expectation', label: '期待', cls: 'expectation' },
      { key: 'relief', label: '安心', cls: 'relief' },
      { key: 'interest', label: '興味', cls: 'interest' }
    ];

    let barsHTML = '';
    emotionData.forEach(e => {
      const pct = emotions[e.key] || 0;
      barsHTML += `
        <div class="emotion-row">
          <span class="emotion-label">${e.label}</span>
          <div class="emotion-bar-outer">
            <div class="emotion-bar-inner ${e.cls}" data-width="${pct}"></div>
          </div>
          <span class="emotion-pct">${pct}%</span>
        </div>`;
    });

    return `
      <div class="card" id="emotionCard">
        <div class="card-header">
          <h2>感情分析</h2>
          <button class="btn-copy" data-target="emotion" title="コピー">📄</button>
        </div>
        <div class="emotion-bars">${barsHTML}</div>
      </div>`;
  }

  /**
   * 競合比較カード
   */
  function renderCompetitor() {
    return `
      <div class="card" id="compCard">
        <div class="card-header">
          <h2>競合比較（疑似）</h2>
          <button class="btn-copy" data-target="comp" title="コピー">📄</button>
        </div>
        <div class="comp-form">
          <input type="text" id="compKeyword" placeholder="キーワードを入力">
          <button id="compBtn" class="btn-small">比較</button>
        </div>
        <table class="comp-table hidden" id="compTable">
          <thead>
            <tr><th>項目</th><th>この記事</th><th>競合平均</th><th>差分</th></tr>
          </thead>
          <tbody id="compBody"></tbody>
        </table>
      </div>`;
  }

  /**
   * 競合比較テーブルの行を更新
   */
  function updateCompTable(data) {
    const table = document.getElementById('compTable');
    const tbody = document.getElementById('compBody');
    if (!table || !tbody) return;

    let html = '';
    data.items.forEach(item => {
      const diff = item.mine - item.comp;
      const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
      let diffClass = 'diff-neutral';
      if (diff > 0) diffClass = 'diff-positive';
      else if (diff < 0) diffClass = 'diff-negative';

      html += `
        <tr>
          <td>${item.label}</td>
          <td>${typeof item.mine === 'number' ? item.mine : item.mine}</td>
          <td>${typeof item.comp === 'number' ? item.comp : item.comp}</td>
          <td class="${diffClass}">${diffStr}</td>
        </tr>`;
    });

    tbody.innerHTML = html;
    table.classList.remove('hidden');
  }

  /**
   * 改善提案カード
   */
  function renderSuggestions(suggestions) {
    let listHTML = '';
    suggestions.forEach((s, i) => {
      const prClass = s.priority === 'high' ? 'priority-high'
                    : s.priority === 'mid'  ? 'priority-mid'
                    : 'priority-low';
      listHTML += `
        <li class="suggest-item">
          <div class="suggest-priority ${prClass}">${i + 1}</div>
          <div class="suggest-text">
            <div class="suggest-title">${s.title}</div>
            <div class="suggest-desc">${s.desc}</div>
          </div>
        </li>`;
    });

    return `
      <div class="card" id="suggestCard">
        <div class="card-header">
          <h2>改善提案</h2>
          <button class="btn-copy" data-target="suggest" title="コピー">📄</button>
        </div>
        <ol class="suggest-list">${listHTML}</ol>
      </div>`;
  }

  /**
   * 感情バーのアニメーション
   */
  function animateEmotionBars() {
    requestAnimationFrame(() => {
      document.querySelectorAll('.emotion-bar-inner[data-width]').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    });
  }

  return {
    renderKeywords,
    renderEmotion,
    renderCompetitor,
    updateCompTable,
    renderSuggestions,
    animateEmotionBars
  };
})();
