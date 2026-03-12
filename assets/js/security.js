/**
 * ============================================================
 * oohi Writing Tool - security.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * コピー防止・ソース閲覧制限
 */
(function () {
  'use strict';

  // 右クリック無効化
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  // キーボードショートカット無効化
  document.addEventListener('keydown', function (e) {
    // Ctrl+C (コピー)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      return false;
    }
    // Ctrl+U (ソース表示)
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      return false;
    }
    // Ctrl+S (保存)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I (DevTools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    // F12 (DevTools)
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+J (Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+C (Inspector)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }
  });

  // DevTools検知
  var devToolsWarningShown = false;
  var threshold = 160;

  function checkDevTools() {
    var widthDiff = window.outerWidth - window.innerWidth > threshold;
    var heightDiff = window.outerHeight - window.innerHeight > threshold;
    if ((widthDiff || heightDiff) && !devToolsWarningShown) {
      devToolsWarningShown = true;
      showDevToolsWarning();
    }
    if (!widthDiff && !heightDiff) {
      devToolsWarningShown = false;
      hideDevToolsWarning();
    }
  }

  function showDevToolsWarning() {
    var existing = document.getElementById('devtoolsWarning');
    if (existing) return;
    var overlay = document.createElement('div');
    overlay.id = 'devtoolsWarning';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="text-align:center;color:#fff;font-family:sans-serif;"><p style="font-size:1.5rem;font-weight:700;margin-bottom:12px;">Developer Tools Detected</p><p style="color:#94a3b8;font-size:.9rem;">このツールのソースコードは保護されています。<br>開発者ツールを閉じてください。</p><p style="margin-top:16px;color:#6366f1;font-size:.8rem;">Copyright &copy; 2024-2026 大野ヒロアキ</p></div>';
    document.body.appendChild(overlay);
  }

  function hideDevToolsWarning() {
    var overlay = document.getElementById('devtoolsWarning');
    if (overlay) overlay.remove();
  }

  setInterval(checkDevTools, 1000);

  // ドラッグ無効化
  document.addEventListener('dragstart', function (e) {
    e.preventDefault();
  });

  // 選択無効化 (CSS user-select: noneと併用)
  document.addEventListener('selectstart', function (e) {
    e.preventDefault();
  });

})();
