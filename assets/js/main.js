/**
 * ============================================================
 * oohi Writing Tool - main.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * アプリケーションのエントリポイント - イベントバインド・フロー制御
 */
(function () {
  'use strict';

  const HISTORY_KEY = 'oohiWritingTool_history';
  let currentResult = null;

  function saveHistory(result) {
    const history = loadHistory();
    history.unshift({
      url: result.article.url,
      title: result.article.title,
      seoScore: result.seo.total,
      cvrScore: result.cvr.total,
      date: new Date().toISOString()
    });
    if (history.length > 20) history.length = 20;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      history.length = 10;
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  async function handleFetch() {
    const url = UI.getURL();
    if (!url) {
      UI.showToast('URLを入力してください');
      return;
    }

    try {
      new URL(url);
    } catch (e) {
      UI.showToast('正しいURLを入力してください');
      return;
    }

    UI.disableFetchBtn();
    UI.showLoading();

    try {
      const article = await ArticleLoader.load(url);

      if (!article.bodyText || article.charCount < 50) {
        throw new Error('記事本文を取得できませんでした。別のURLを試してください。');
      }

      const result = Analyzer.analyze(article);
      currentResult = result;

      UI.hideLoading();
      UI.renderArticle(article);
      UI.renderResults(result);
      UI.showMain();

      setupCompButton();
      setupCopyButtons();
      saveHistory(result);

    } catch (err) {
      UI.showError(err.message || '記事の取得に失敗しました');
      UI.enableFetchBtn();
      return;
    }

    UI.enableFetchBtn();
  }

  function setupCompButton() {
    const compBtn = document.getElementById('compBtn');
    const compKW = document.getElementById('compKeyword');
    if (!compBtn || !compKW || !currentResult) return;

    compBtn.addEventListener('click', () => {
      const keyword = compKW.value.trim();
      if (!keyword) {
        UI.showToast('キーワードを入力してください');
        return;
      }
      const compData = ScoreCalculator.generateCompetitorData(currentResult.article, keyword);
      KeywordList.updateCompTable(compData);
    });
  }

  function setupCopyButtons() {
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!currentResult) return;

        const target = btn.dataset.target;
        const text = Analyzer.sectionToText(currentResult, target);

        navigator.clipboard.writeText(text).then(() => {
          UI.showToast('コピーしました');
        }).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          UI.showToast('コピーしました');
        });
      });
    });
  }

  function init() {
    console.log(
      '%coohi Writing Tool%c\nDeveloped by 大野ヒロアキ (Hiroaki Ohno)\nCopyright (c) 2024-2026 All Rights Reserved.',
      'font-size:14px;font-weight:bold;color:#6366f1;',
      'font-size:10px;color:#64748b;'
    );

    UI.cacheElements();
    UI.loadTheme();

    UI.els.fetchBtn.addEventListener('click', handleFetch);

    UI.els.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleFetch();
    });

    UI.els.themeToggle.addEventListener('click', UI.toggleTheme);

    UI.els.historyToggle.addEventListener('click', () => {
      UI.showHistory(loadHistory());
    });

    UI.els.historyClose.addEventListener('click', UI.hideHistory);

    // モーダルオーバーレイクリックで閉じる
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', UI.hideHistory);
    }

    UI.els.historyList.addEventListener('click', (e) => {
      const item = e.target.closest('.history-item');
      if (!item) return;
      const history = loadHistory();
      const idx = parseInt(item.dataset.index);
      if (history[idx]) {
        UI.els.urlInput.value = history[idx].url;
        UI.hideHistory();
        handleFetch();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
