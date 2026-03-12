/**
 * ============================================================
 * 大野ヒロアキ流 記事チェック - textAnalyzer.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * テキストの基礎解析ユーティリティ
 */
const TextAnalyzer = (() => {
  // 日本語ストップワード
  const STOP_WORDS = new Set([
    'の','に','は','を','た','が','で','て','と','し','れ','さ','ある','いる',
    'も','する','から','な','こと','として','い','や','れる','など','なっ',
    'ない','この','ため','その','あっ','よう','また','もの','という','あり',
    'まで','られ','なる','へ','か','だ','これ','によって','により','おり',
    'より','による','ず','なり','られる','において','ば','なかっ','なく',
    'しかし','について','せ','だっ','それ','ほど','ながら','うち','そして',
    'とも','ただ','その他','それぞれ','ただし','です','ます','でした',
    'ました','でしょう','ましょう','ません','ですが','ですから','ですので',
    'ところ','あと','それから','そこで','だから','ところが','けれども',
    'ちょっと','ちゃん','さん','くん','さま','よね','かな','わね','だね',
    'って','じゃ','けど','だけど','とか','なんか','みたい','そう','どう',
    'こう','ああ','おお','えっ'
  ]);

  /**
   * テキストから文字数を算出
   */
  function countChars(text) {
    return text.replace(/\s/g, '').length;
  }

  /**
   * 段落数を算出
   */
  function countParagraphs(text) {
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || 1;
  }

  /**
   * 平均文長を算出
   */
  function avgSentenceLength(text) {
    const sentences = text.split(/[。！？!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    const totalChars = sentences.reduce((sum, s) => sum + s.replace(/\s/g, '').length, 0);
    return Math.round(totalChars / sentences.length);
  }

  /**
   * 日本語テキストをトークンに分割（簡易）
   */
  function tokenize(text) {
    const cleaned = text.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEFa-zA-Z0-9ー]/g, ' ');
    // 漢字の連続、カタカナの連続、ひらがな2文字以上、英字を抽出
    const pattern = /[\u4E00-\u9FFF]{2,}|[\u30A0-\u30FF\uFF00-\uFFEFー]{2,}|[\u3040-\u309F]{2,}|[a-zA-Z]{3,}/g;
    const matches = cleaned.match(pattern) || [];
    return matches.filter(w => !STOP_WORDS.has(w) && w.length >= 2);
  }

  /**
   * キーワード頻度を算出しソート
   */
  function keywordFrequency(text, topN = 10) {
    const tokens = tokenize(text);
    const freq = {};
    tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word, count]) => ({ word, count }));
  }

  /**
   * 特定キーワードの出現密度(%)
   */
  function keywordDensity(text, keyword) {
    if (!keyword) return 0;
    const total = countChars(text);
    if (total === 0) return 0;
    const regex = new RegExp(keyword, 'gi');
    const matches = text.match(regex) || [];
    return parseFloat(((matches.length * keyword.length) / total * 100).toFixed(2));
  }

  /**
   * CTA（行動喚起）表現の数
   */
  function countCTA(text) {
    const ctaPatterns = [
      /今すぐ/g, /お申し込み/g, /お問い合わせ/g, /無料/g,
      /ダウンロード/g, /登録/g, /購入/g, /クリック/g,
      /詳しくは/g, /こちら/g, /始め/g, /試し/g,
      /限定/g, /特別/g, /キャンペーン/g, /申込/g,
      /お試し/g, /体験/g, /資料請求/g
    ];
    let count = 0;
    ctaPatterns.forEach(p => {
      const m = text.match(p);
      if (m) count += m.length;
    });
    return count;
  }

  /**
   * FAQ的要素の数
   */
  function countFAQ(text) {
    const faqPatterns = [
      /[?？]/g,
      /よくある質問/g, /FAQ/gi, /Ｑ＆Ａ/g, /Q&A/gi,
      /質問/g
    ];
    let count = 0;
    faqPatterns.forEach(p => {
      const m = text.match(p);
      if (m) count += m.length;
    });
    return Math.min(count, 30);
  }

  /**
   * 感情キーワード辞書に基づく感情スコア推定
   */
  function analyzeEmotion(text) {
    const dict = {
      anxiety: ['不安','心配','リスク','危険','失敗','損','問題','悩み','困','怖','注意','警告','トラブル','デメリット'],
      expectation: ['期待','楽しみ','ワクワク','チャンス','可能性','成長','成功','夢','目標','希望','メリット','効果'],
      relief: ['安心','安全','保証','サポート','実績','信頼','確実','返金','無料','簡単','手軽','便利'],
      interest: ['おすすめ','人気','話題','最新','注目','ランキング','比較','方法','コツ','秘訣','ポイント','裏技']
    };

    const scores = {};
    let total = 0;

    Object.entries(dict).forEach(([emotion, words]) => {
      let count = 0;
      words.forEach(w => {
        const regex = new RegExp(w, 'g');
        const m = text.match(regex);
        if (m) count += m.length;
      });
      scores[emotion] = count;
      total += count;
    });

    // 正規化 (0-100)
    if (total === 0) {
      return { anxiety: 25, expectation: 25, relief: 25, interest: 25 };
    }
    Object.keys(scores).forEach(k => {
      scores[k] = Math.round((scores[k] / total) * 100);
    });
    return scores;
  }

  /**
   * 信頼性シグナルの検出
   */
  function countTrustSignals(text) {
    const patterns = [
      /実績/g, /年/g, /万人/g, /件/g, /お客様の声/g,
      /レビュー/g, /口コミ/g, /評価/g, /受賞/g,
      /認定/g, /資格/g, /専門/g, /監修/g, /証明/g,
      /データ/g, /調査/g, /研究/g, /論文/g, /統計/g
    ];
    let count = 0;
    patterns.forEach(p => {
      const m = text.match(p);
      if (m) count += m.length;
    });
    return count;
  }

  /**
   * ベネフィット表現の数
   */
  function countBenefits(text) {
    const patterns = [
      /できる/g, /なれる/g, /手に入/g, /解決/g, /改善/g,
      /アップ/g, /向上/g, /節約/g, /時短/g, /効率/g,
      /メリット/g, /効果/g, /結果/g
    ];
    let count = 0;
    patterns.forEach(p => {
      const m = text.match(p);
      if (m) count += m.length;
    });
    return count;
  }

  /**
   * 不安解消表現の数
   */
  function countAnxietyRelief(text) {
    const patterns = [
      /安心/g, /安全/g, /保証/g, /返金/g, /サポート/g,
      /リスクなし/g, /大丈夫/g, /心配.*ない/g, /問題.*ない/g
    ];
    let count = 0;
    patterns.forEach(p => {
      const m = text.match(p);
      if (m) count += m.length;
    });
    return count;
  }

  /**
   * 希少性表現の数
   */
  function countScarcity(text) {
    const patterns = [
      /限定/g, /先着/g, /残り/g, /今だけ/g, /期間限定/g,
      /数量限定/g, /特別/g, /プレミアム/g, /希少/g, /レア/g
    ];
    let count = 0;
    patterns.forEach(p => {
      const m = text.match(p);
      if (m) count += m.length;
    });
    return count;
  }

  /**
   * ストーリー要素の検出
   */
  function countStoryElements(text) {
    const patterns = [
      /体験/g, /経験/g, /実は/g, /きっかけ/g, /ストーリー/g,
      /エピソード/g, /私は/g, /僕は/g, /始め/g, /以前/g,
      /当時/g, /最初/g, /その後/g, /結局/g, /ある日/g
    ];
    let count = 0;
    patterns.forEach(p => {
      const m = text.match(p);
      if (m) count += m.length;
    });
    return count;
  }

  // Public API
  return {
    countChars,
    countParagraphs,
    avgSentenceLength,
    tokenize,
    keywordFrequency,
    keywordDensity,
    countCTA,
    countFAQ,
    analyzeEmotion,
    countTrustSignals,
    countBenefits,
    countAnxietyRelief,
    countScarcity,
    countStoryElements
  };
})();
