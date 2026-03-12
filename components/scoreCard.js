/**
 * ============================================================
 * 大野ヒロアキ流 記事チェック - scoreCard.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * SEO/CVRスコアカードのHTML生成
 */
const ScoreCard = (() => {

  /**
   * スコアカードHTMLを生成
   * @param {string} type  'seo' | 'cvr'
   * @param {string} label 表示ラベル
   * @param {Object} result { total, details[] }
   * @returns {string} HTML文字列
   */
  function render(type, label, result) {
    const fgClass = type === 'seo' ? 'seo-fg' : 'cvr-fg';
    const circleId = `${type}Circle`;
    const scoreId = `${type}Score`;

    let detailsHTML = '';
    result.details.forEach(d => {
      const pct = Math.round((d.score / d.max) * 100);
      let barClass = 'high';
      if (pct < 50) barClass = 'low';
      else if (pct < 75) barClass = 'mid';

      detailsHTML += `
        <li>
          <span class="eval-name">${d.name}</span>
          <div class="eval-bar-wrap">
            <div class="eval-bar">
              <div class="eval-bar-fill ${barClass}" data-width="${pct}"></div>
            </div>
            <span class="eval-val">${d.score}/${d.max}</span>
          </div>
        </li>`;
    });

    return `
      <div class="card" id="${type}Card">
        <div class="card-header">
          <h2>${label}</h2>
          <button class="btn-copy" data-target="${type}" title="コピー">📄</button>
        </div>
        <div class="score-circle-wrap">
          <svg class="score-circle" viewBox="0 0 120 120">
            <circle class="score-bg" cx="60" cy="60" r="52"/>
            <circle class="score-fg ${fgClass}" cx="60" cy="60" r="52" id="${circleId}"/>
          </svg>
          <div class="score-value" id="${scoreId}">0</div>
          <div class="score-label">${label}スコア</div>
        </div>
        <ul class="eval-list">${detailsHTML}</ul>
      </div>`;
  }

  /**
   * スコアアニメーション開始
   * @param {string} type   'seo' | 'cvr'
   * @param {number} score  0-100
   */
  function animateScore(type, score) {
    const circumference = 2 * Math.PI * 52; // ≈ 326.73
    const circle = document.getElementById(`${type}Circle`);
    const valueEl = document.getElementById(`${type}Score`);

    if (!circle || !valueEl) return;

    // Circle animation
    const offset = circumference - (score / 100) * circumference;
    requestAnimationFrame(() => {
      circle.style.strokeDashoffset = offset;
    });

    // Number count-up
    let current = 0;
    const duration = 1500;
    const step = score / (duration / 16);
    const timer = setInterval(() => {
      current += step;
      if (current >= score) {
        current = score;
        clearInterval(timer);
      }
      valueEl.textContent = Math.round(current);
    }, 16);
  }

  /**
   * 詳細バーのアニメーション開始
   */
  function animateBars() {
    requestAnimationFrame(() => {
      document.querySelectorAll('.eval-bar-fill[data-width]').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    });
  }

  return { render, animateScore, animateBars };
})();
