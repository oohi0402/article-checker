/**
 * ============================================================
 * 大野ヒロアキ流 記事チェック - personaCard.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * ペルソナ推定カードのHTML生成
 */
const PersonaCard = (() => {

  /**
   * ペルソナカードHTMLを生成
   * @param {Object} persona { age, gender, job, worry, intent, buyIntent, topKeywords[] }
   * @returns {string} HTML文字列
   */
  function render(persona) {
    // 性別に応じたアバターアイコン
    let avatar = '👤';
    if (persona.gender.includes('女性')) avatar = '👩';
    else if (persona.gender.includes('男性')) avatar = '👨';

    const rows = [
      { label: '年齢層', value: persona.age },
      { label: '性別傾向', value: persona.gender },
      { label: '職業', value: persona.job },
      { label: '悩み', value: persona.worry },
      { label: '検索意図', value: persona.intent },
      { label: '購買意欲', value: persona.buyIntent }
    ];

    let rowsHTML = '';
    rows.forEach(r => {
      rowsHTML += `
        <div class="persona-row">
          <span class="persona-label">${r.label}</span>
          <span class="persona-val">${r.value}</span>
        </div>`;
    });

    return `
      <div class="card" id="personaCard">
        <div class="card-header">
          <h2>ペルソナ推定</h2>
          <button class="btn-copy" data-target="persona" title="コピー">📄</button>
        </div>
        <div class="persona-profile">
          <div class="persona-avatar">${avatar}</div>
          <div class="persona-info">${rowsHTML}</div>
        </div>
      </div>`;
  }

  /**
   * ペルソナ情報をテキストに変換（コピー用）
   */
  function toText(persona) {
    return [
      `【ペルソナ推定】`,
      `年齢層: ${persona.age}`,
      `性別傾向: ${persona.gender}`,
      `職業: ${persona.job}`,
      `悩み: ${persona.worry}`,
      `検索意図: ${persona.intent}`,
      `購買意欲: ${persona.buyIntent}`
    ].join('\n');
  }

  return { render, toText };
})();
