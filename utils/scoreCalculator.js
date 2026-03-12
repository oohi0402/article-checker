/**
 * ============================================================
 * 大野ヒロアキ流 記事チェック - scoreCalculator.js
 * Copyright (c) 2024-2026 大野ヒロアキ (Hiroaki Ohno)
 * All Rights Reserved. 無断複製・転載・再配布を禁じます。
 * ============================================================
 * SEO/CVRスコアの算出ロジック
 */
const ScoreCalculator = (() => {

  /**
   * SEOスコアを算出
   * @param {Object} article  { title, headings[], bodyText, charCount, paragraphs, avgSentLen }
   * @returns {Object} { total, details[] }
   */
  function calcSEO(article) {
    const details = [];

    // 1) タイトル評価 (0-20)
    let titleScore = 0;
    const tLen = (article.title || '').length;
    if (tLen >= 15 && tLen <= 40) titleScore = 20;
    else if (tLen >= 10 && tLen <= 60) titleScore = 14;
    else if (tLen > 0) titleScore = 8;
    details.push({ name: 'タイトル評価', score: titleScore, max: 20 });

    // 2) 見出し構造 (0-20)
    let headingScore = 0;
    const hCount = article.headings.length;
    if (hCount >= 5 && hCount <= 15) headingScore = 20;
    else if (hCount >= 3 && hCount <= 20) headingScore = 14;
    else if (hCount >= 1) headingScore = 8;
    // h2,h3の階層チェック
    const hasH2 = article.headings.some(h => h.level === 2);
    const hasH3 = article.headings.some(h => h.level === 3);
    if (hasH2 && hasH3) headingScore = Math.min(20, headingScore + 2);
    details.push({ name: '見出し構造', score: headingScore, max: 20 });

    // 3) キーワード最適化 (0-20)
    let kwScore = 0;
    const topKW = TextAnalyzer.keywordFrequency(article.bodyText, 3);
    if (topKW.length > 0) {
      const density = TextAnalyzer.keywordDensity(article.bodyText, topKW[0].word);
      // タイトルにトップキーワードが含まれるか
      const kwInTitle = topKW.some(k => (article.title || '').includes(k.word));
      // 見出しにトップキーワードが含まれるか
      const headingTexts = article.headings.map(h => h.text).join(' ');
      const kwInHeadings = topKW.some(k => headingTexts.includes(k.word));

      if (density >= 1 && density <= 4) kwScore += 8;
      else if (density > 0) kwScore += 4;
      if (kwInTitle) kwScore += 6;
      if (kwInHeadings) kwScore += 6;
    }
    details.push({ name: 'キーワード最適化', score: Math.min(kwScore, 20), max: 20 });

    // 4) 可読性 (0-20)
    let readScore = 0;
    const asl = article.avgSentLen;
    if (asl >= 20 && asl <= 60) readScore = 12;
    else if (asl > 0 && asl < 80) readScore = 6;
    // 段落数
    if (article.paragraphs >= 5) readScore += 4;
    else if (article.paragraphs >= 3) readScore += 2;
    // 文字数
    if (article.charCount >= 2000 && article.charCount <= 10000) readScore += 4;
    else if (article.charCount >= 1000) readScore += 2;
    details.push({ name: '可読性', score: Math.min(readScore, 20), max: 20 });

    // 5) 検索意図一致 (0-20)
    let intentScore = 0;
    // FAQ的要素があるか
    const faqCount = TextAnalyzer.countFAQ(article.bodyText);
    if (faqCount >= 3) intentScore += 6;
    else if (faqCount >= 1) intentScore += 3;
    // リスト/手順があるか（見出し数で代用）
    if (hCount >= 3) intentScore += 5;
    // 十分な文字数
    if (article.charCount >= 1500) intentScore += 5;
    // 結論・まとめがあるか
    const hasConclusion = /まとめ|結論|最後に|おわりに/.test(article.bodyText);
    if (hasConclusion) intentScore += 4;
    details.push({ name: '検索意図一致', score: Math.min(intentScore, 20), max: 20 });

    const total = details.reduce((s, d) => s + d.score, 0);
    return { total, details };
  }

  /**
   * CVRスコアを算出
   * @param {Object} article
   * @returns {Object} { total, details[] }
   */
  function calcCVR(article) {
    const details = [];
    const text = article.bodyText;

    // 1) ファーストビュー (0-15)
    let fvScore = 0;
    const firstPart = text.slice(0, 300);
    if (firstPart.length >= 100) fvScore += 5;
    const hasBenefitFirst = /メリット|効果|解決|できる/.test(firstPart);
    if (hasBenefitFirst) fvScore += 5;
    const hasHookFirst = /悩み|問題|困|なぜ|どう/.test(firstPart);
    if (hasHookFirst) fvScore += 5;
    details.push({ name: 'ファーストビュー', score: Math.min(fvScore, 15), max: 15 });

    // 2) ベネフィット (0-15)
    let benScore = 0;
    const benefitCount = TextAnalyzer.countBenefits(text);
    if (benefitCount >= 8) benScore = 15;
    else if (benefitCount >= 4) benScore = 10;
    else if (benefitCount >= 1) benScore = 5;
    details.push({ name: 'ベネフィット', score: benScore, max: 15 });

    // 3) 信頼性 (0-15)
    let trustScore = 0;
    const trustCount = TextAnalyzer.countTrustSignals(text);
    if (trustCount >= 8) trustScore = 15;
    else if (trustCount >= 4) trustScore = 10;
    else if (trustCount >= 1) trustScore = 5;
    details.push({ name: '信頼性', score: trustScore, max: 15 });

    // 4) ストーリー (0-10)
    let storyScore = 0;
    const storyCount = TextAnalyzer.countStoryElements(text);
    if (storyCount >= 5) storyScore = 10;
    else if (storyCount >= 2) storyScore = 6;
    else if (storyCount >= 1) storyScore = 3;
    details.push({ name: 'ストーリー', score: storyScore, max: 10 });

    // 5) CTA (0-15)
    let ctaScore = 0;
    const ctaCount = TextAnalyzer.countCTA(text);
    if (ctaCount >= 5) ctaScore = 15;
    else if (ctaCount >= 3) ctaScore = 10;
    else if (ctaCount >= 1) ctaScore = 5;
    details.push({ name: 'CTA', score: ctaScore, max: 15 });

    // 6) 不安解消 (0-15)
    let anxScore = 0;
    const anxCount = TextAnalyzer.countAnxietyRelief(text);
    if (anxCount >= 5) anxScore = 15;
    else if (anxCount >= 2) anxScore = 10;
    else if (anxCount >= 1) anxScore = 5;
    details.push({ name: '不安解消', score: anxScore, max: 15 });

    // 7) 希少性 (0-15)
    let scarScore = 0;
    const scarCount = TextAnalyzer.countScarcity(text);
    if (scarCount >= 4) scarScore = 15;
    else if (scarCount >= 2) scarScore = 10;
    else if (scarCount >= 1) scarScore = 5;
    details.push({ name: '希少性', score: scarScore, max: 15 });

    const total = details.reduce((s, d) => s + d.score, 0);
    return { total, details };
  }

  /**
   * ペルソナ推定
   */
  function estimatePersona(article) {
    const text = article.bodyText;
    const topKW = TextAnalyzer.keywordFrequency(text, 5);
    const kwWords = topKW.map(k => k.word);

    // ビジネス系か、ライフスタイル系か判定
    const bizWords = ['ビジネス','マーケティング','集客','売上','経営','起業','副業','収入','投資','転職','キャリア','仕事','会社','営業','戦略'];
    const lifeWords = ['健康','美容','ダイエット','料理','旅行','子育て','暮らし','インテリア','ファッション','恋愛','結婚','趣味'];
    const techWords = ['プログラミング','エンジニア','開発','コード','IT','Web','アプリ','システム','デザイン','UI','サーバー'];

    let bizCount = 0, lifeCount = 0, techCount = 0;
    bizWords.forEach(w => { if (text.includes(w)) bizCount++; });
    lifeWords.forEach(w => { if (text.includes(w)) lifeCount++; });
    techWords.forEach(w => { if (text.includes(w)) techCount++; });

    const maxCat = Math.max(bizCount, lifeCount, techCount);

    let age, gender, job, worry, intent, buyIntent;

    if (maxCat === techCount && techCount > 0) {
      age = '25-40歳';
      gender = '男性寄り';
      job = 'ITエンジニア / Web関連';
      worry = 'スキルアップ・キャリア形成';
      intent = '技術的な解決策を探している';
      buyIntent = '中〜高（ツール導入に前向き）';
    } else if (maxCat === bizCount && bizCount > 0) {
      age = '30-50歳';
      gender = '男女均等';
      job = '経営者 / マーケター / 会社員';
      worry = '売上向上・集客・キャリア';
      intent = 'ビジネス課題の解決策を探している';
      buyIntent = '高（ROIに敏感）';
    } else if (maxCat === lifeCount && lifeCount > 0) {
      age = '20-45歳';
      gender = '女性寄り';
      job = '会社員 / 主婦 / フリーランス';
      worry = '生活の質向上・自分磨き';
      intent = '生活改善のヒントを探している';
      buyIntent = '中（口コミを重視）';
    } else {
      age = '25-45歳';
      gender = '男女均等';
      job = '会社員 / 自営業';
      worry = '情報収集・課題解決';
      intent = '具体的な情報を探している';
      buyIntent = '中';
    }

    // 感情分析から悩みを補強
    const emotions = TextAnalyzer.analyzeEmotion(text);
    if (emotions.anxiety > 35) {
      worry += '（不安が強い）';
      buyIntent = '高（解決を急いでいる）';
    }

    return { age, gender, job, worry, intent, buyIntent, topKeywords: kwWords };
  }

  /**
   * 改善提案を生成
   */
  function generateSuggestions(article, seoResult, cvrResult) {
    const suggestions = [];

    // 文字数チェック
    if (article.charCount < 1500) {
      suggestions.push({
        priority: 'high',
        title: '文字数不足',
        desc: `現在${article.charCount}文字です。SEO対策として1,500文字以上を目指しましょう。`
      });
    }

    // FAQ
    const faqCount = TextAnalyzer.countFAQ(article.bodyText);
    if (faqCount < 3) {
      suggestions.push({
        priority: 'high',
        title: 'FAQ追加',
        desc: 'よくある質問セクションを追加すると、検索意図への対応力が上がります。'
      });
    }

    // CTA
    const ctaCount = TextAnalyzer.countCTA(article.bodyText);
    if (ctaCount < 3) {
      suggestions.push({
        priority: 'high',
        title: 'CTA強化',
        desc: '行動喚起（CTA）を記事中に3箇所以上配置しましょう。'
      });
    }

    // 見出し
    if (article.headings.length < 3) {
      suggestions.push({
        priority: 'high',
        title: '見出し追加',
        desc: '見出し（H2/H3）を増やして記事構造を明確にしましょう。'
      });
    }

    // タイトル長
    const tLen = (article.title || '').length;
    if (tLen < 15 || tLen > 40) {
      suggestions.push({
        priority: 'mid',
        title: 'タイトル最適化',
        desc: 'タイトルは15〜40文字が理想的です。キーワードを含めましょう。'
      });
    }

    // 信頼性
    const trustCount = TextAnalyzer.countTrustSignals(article.bodyText);
    if (trustCount < 4) {
      suggestions.push({
        priority: 'mid',
        title: '信頼性向上',
        desc: 'データ・実績・口コミなど信頼性を高める要素を追加しましょう。'
      });
    }

    // 不安解消
    const anxCount = TextAnalyzer.countAnxietyRelief(article.bodyText);
    if (anxCount < 2) {
      suggestions.push({
        priority: 'mid',
        title: '不安解消の追加',
        desc: '保証・サポート情報など読者の不安を解消する要素を入れましょう。'
      });
    }

    // ストーリー
    const storyCount = TextAnalyzer.countStoryElements(article.bodyText);
    if (storyCount < 2) {
      suggestions.push({
        priority: 'low',
        title: 'ストーリー要素',
        desc: '体験談やエピソードを加えると説得力と共感が高まります。'
      });
    }

    // 希少性
    const scarCount = TextAnalyzer.countScarcity(article.bodyText);
    if (scarCount < 1) {
      suggestions.push({
        priority: 'low',
        title: '希少性の演出',
        desc: '限定・期間限定などの表現で行動を促しましょう。'
      });
    }

    // まとめ
    const hasConclusion = /まとめ|結論|最後に|おわりに/.test(article.bodyText);
    if (!hasConclusion) {
      suggestions.push({
        priority: 'mid',
        title: 'まとめセクション追加',
        desc: '記事末尾に「まとめ」を追加すると読者の理解が深まります。'
      });
    }

    return suggestions;
  }

  /**
   * 競合比較データを疑似生成
   */
  function generateCompetitorData(article, keyword) {
    // 疑似的な競合平均値を生成
    const charCount = article.charCount;
    const headingCount = article.headings.length;
    const kwDensity = TextAnalyzer.keywordDensity(article.bodyText, keyword);
    const faqCount = TextAnalyzer.countFAQ(article.bodyText);
    const ctaCount = TextAnalyzer.countCTA(article.bodyText);

    // 競合平均を少し高めに設定
    const compAvg = {
      charCount: Math.round(charCount * (1 + (Math.random() * 0.4 + 0.1))),
      headingCount: Math.max(headingCount + Math.round(Math.random() * 4 - 1), 3),
      kwDensity: parseFloat((kwDensity + Math.random() * 1.5).toFixed(2)),
      faqCount: Math.max(faqCount + Math.round(Math.random() * 3), 2),
      ctaCount: Math.max(ctaCount + Math.round(Math.random() * 3), 3)
    };

    return {
      items: [
        { label: '文字数', mine: charCount, comp: compAvg.charCount },
        { label: '見出し数', mine: headingCount, comp: compAvg.headingCount },
        { label: 'KW密度(%)', mine: kwDensity, comp: compAvg.kwDensity },
        { label: 'FAQ数', mine: faqCount, comp: compAvg.faqCount },
        { label: 'CTA数', mine: ctaCount, comp: compAvg.ctaCount }
      ]
    };
  }

  return {
    calcSEO,
    calcCVR,
    estimatePersona,
    generateSuggestions,
    generateCompetitorData
  };
})();
