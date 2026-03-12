/**
 * ============================================================
 * 大野ヒロアキ流 記事チェック - main.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * アプリケーションのエントリポイント - イベントバインド・フロー制御
 */
(function () {
  'use strict';

  const HISTORY_KEY = 'articleChecker_history';
  let currentResult = null;

  /**
   * 診断履歴をlocalStorageに保存
   */
  function saveHistory(result) {
    const history = loadHistory();
    history.unshift({
      url: result.article.url,
      title: result.article.title,
      seoScore: result.seo.total,
      cvrScore: result.cvr.total,
      date: new Date().toISOString()
    });
    // 最大20件
    if (history.length > 20) history.length = 20;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      // ストレージフルの場合は古いものを削除
      history.length = 10;
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }

  /**
   * 診断履歴を読み込み
   */
  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * メインの記事取得→分析フロー
   */
  async function handleFetch() {
    const url = UI.getURL();
    if (!url) {
      UI.showToast('URLを入力してください');
      return;
    }

    // 簡易URL検証
    try {
      new URL(url);
    } catch (e) {
      UI.showToast('正しいURLを入力してください');
      return;
    }

    UI.disableFetchBtn();
    UI.showLoading();

    try {
      // 記事取得
      const article = await ArticleLoader.load(url);

      if (!article.bodyText || article.charCount < 50) {
        throw new Error('記事本文を取得できませんでした。別のURLを試してください。');
      }

      // 分析実行
      const result = Analyzer.analyze(article);
      currentResult = result;

      // UI更新
      UI.hideLoading();
      UI.renderArticle(article);
      UI.renderResults(result);
      UI.showMain();

      // 競合比較ボタンのイベント設定
      setupCompButton();

      // コピーボタンのイベント設定
      setupCopyButtons();

      // 履歴保存
      saveHistory(result);

    } catch (err) {
      UI.showError(err.message || '記事の取得に失敗しました');
      UI.enableFetchBtn();
      return;
    }

    UI.enableFetchBtn();
  }

  /**
   * 競合比較ボタン
   */
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

  /**
   * 各カードのコピーボタン
   */
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
          // fallback
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

  /**
   * 初期化
   */
  function init() {
    console.log(
      '%c大野ヒロアキ流 記事チェック%c\n開発者: 大野ヒロアキ (Hiroaki Ohno)\nCopyright (c) 2024-2026 All Rights Reserved.\n無断複製・転載・再配布を禁じます。',
      'font-size:16px;font-weight:bold;color:#6366f1;',
      'font-size:11px;color:#6b7280;'
    );

    UI.cacheElements();
    UI.loadTheme();

    // 記事読み込みボタン
    UI.els.fetchBtn.addEventListener('click', handleFetch);

    // Enterキーでも実行
    UI.els.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleFetch();
    });

    // テーマ切替
    UI.els.themeToggle.addEventListener('click', UI.toggleTheme);

    // 履歴モーダル
    UI.els.historyToggle.addEventListener('click', () => {
      UI.showHistory(loadHistory());
    });

    UI.els.historyClose.addEventListener('click', UI.hideHistory);

    // モーダル外クリックで閉じる
    UI.els.historyModal.addEventListener('click', (e) => {
      if (e.target === UI.els.historyModal) UI.hideHistory();
    });

    // 履歴アイテムクリックでURL入力
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

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
