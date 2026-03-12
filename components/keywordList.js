/**
 * ============================================================
 * oohi Writing Tool - keywordList.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * キーワード分析・感情分析・競合比較・改善提案・改善アドバイスカードのHTML生成
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
          <button class="btn-copy" data-target="keyword" title="コピー">Copy</button>
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
          <button class="btn-copy" data-target="emotion" title="コピー">Copy</button>
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
          <h2>競合比較</h2>
          <button class="btn-copy" data-target="comp" title="コピー">Copy</button>
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
          <td>${item.mine}</td>
          <td>${item.comp}</td>
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
          <button class="btn-copy" data-target="suggest" title="コピー">Copy</button>
        </div>
        <ol class="suggest-list">${listHTML}</ol>
      </div>`;
  }

  /**
   * 記事改善アドバイスカード
   */
  function renderAdvice(advice) {
    if (!advice) return '';

    let html = '<div class="card" id="adviceCard"><div class="card-header"><h2>記事改善アドバイス</h2><button class="btn-copy" data-target="advice" title="コピー">Copy</button></div>';

    // タイトル改善
    if (advice.title && advice.title.length > 0) {
      html += '<div class="advice-section"><h3>タイトルの改善</h3>';
      advice.title.forEach(t => {
        html += '<div class="advice-item">' + t + '</div>';
      });
      if (advice.titleExamples && advice.titleExamples.length > 0) {
        html += '<div style="margin-top:8px;font-size:.8rem;font-weight:600;color:var(--text-sub);">タイトル案:</div>';
        advice.titleExamples.forEach(ex => {
          html += '<div class="advice-title-example">' + ex + '</div>';
        });
      }
      html += '</div>';
    }

    // 見出し構造改善
    if (advice.headings && advice.headings.length > 0) {
      html += '<div class="advice-section"><h3>見出し構造の改善</h3>';
      advice.headings.forEach(h => {
        html += '<div class="advice-item">' + h + '</div>';
      });
      html += '</div>';
    }

    // 導入文改善
    if (advice.intro && advice.intro.length > 0) {
      html += '<div class="advice-section"><h3>導入文の改善</h3>';
      advice.intro.forEach(t => {
        html += '<div class="advice-item">' + t + '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
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
    renderAdvice,
    animateEmotionBars
  };
})();
